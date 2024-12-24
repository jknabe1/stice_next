from fastapi import FastAPI, Request, Depends, HTTPException, Form, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from pydantic import BaseModel
import os
from redis import StrictRedis
from dotenv import load_dotenv
from fake_modell_2 import FakeModel
import asyncio
import openai

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Add session middleware
app.add_middleware(SessionMiddleware, secret_key=os.getenv("APP_SECRET_KEY"))

# Configure OAuth
oauth = OAuth()
oauth.register(
    "auth0",
    client_id=os.getenv("AUTH0_CLIENT_ID"),
    client_secret=os.getenv("AUTH0_CLIENT_SECRET"),
    client_kwargs={"scope": "openid profile email"},
    server_metadata_url=f'https://{os.getenv("AUTH0_DOMAIN")}/.well-known/openid-configuration',
)

# Redis setup
redis_client = StrictRedis(host="localhost", port=6379, decode_responses=True)

# Initialize FakeModel
model = FakeModel()

# Workflow management
workflows = list(model.workflows.keys())
current_workflow_index = 0

def get_next_workflow():
    global current_workflow_index
    workflow = workflows[current_workflow_index]
    current_workflow_index = (current_workflow_index + 1) % len(workflows)
    return workflow

# Helper function for API key rotation
api_keys = [key for key in os.environ if key.startswith("OPENAI_API_KEY_")]
current_api_key_index = 0

def get_next_api_key():
    global current_api_key_index
    api_keys = [os.getenv(f"OPENAI_API_KEY_{i+1}") for i in range(2) if os.getenv(f"OPENAI_API_KEY_{i+1}")]
    api_key = api_keys[current_api_key_index]
    print(f"Using API Key: {api_key}") 
    current_api_key_index = (current_api_key_index + 1) % len(api_keys)
    return api_key

@app.middleware("http")
async def ensure_workflow_assigned(request: Request, call_next):
    if "session" not in request.scope:
        request.scope["session"] = {}
    if "workflow" not in request.scope["session"]:
        request.scope["session"]["workflow"] = get_next_workflow()
    print(f"Assigned workflow: {request.scope['session']['workflow']}")
    response = await call_next(request)
    return response

# Pydantic model for chatbot input
class ChatRequest(BaseModel):
    message: str

# Routes
# @app.get("/", response_class=HTMLResponse)
# async def home(request: Request):
#     user = request.scope.get("session", {}).get("user")
#     return templates.TemplateResponse("home.html", {"request": request, "session": user})

# @app.get("/login")
# async def login(request: Request):
#     redirect_uri = os.getenv("REDIRECT_URI")
#     try:
#         return await oauth.auth0.authorize_redirect(request, redirect_uri)
#     except AttributeError as e:
#         raise HTTPException(status_code=500, detail=f"Session handling error: {e}")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Simulate a logged-in user for testing purposes
    request.scope["session"] = {"user": {"userinfo": {"name": "Test User"}}}
    user = request.scope.get("session", {}).get("user")

@app.get("/login")
async def login():
    redirect_uri = os.getenv("REDIRECT_URI")
    return await oauth.auth0.authorize_redirect(redirect_uri)

@app.get("/callback")
async def callback(request: Request):
    try:
        token = await oauth.auth0.authorize_access_token(request)
        request.scope["session"]["user"] = token.get("userinfo")
        return RedirectResponse(url="/")
    except AttributeError as e:
        raise HTTPException(status_code=500, detail=f"Session handling error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth0 error: {e}")

@app.get("/logout")
async def logout(request: Request):
    request.scope["session"].clear()
    logout_url = (
        f"https://{os.getenv('AUTH0_DOMAIN')}/v2/logout?"
        f"returnTo=http://{os.getenv('HOST', 'localhost')}:{os.getenv('PORT', '8000')}&"
        f"client_id={os.getenv('AUTH0_CLIENT_ID')}"
    )
    return RedirectResponse(url=logout_url)

@app.get("/get_assistants")
async def get_assistants(request: Request):
    session = request.scope.get("session", {})
    workflow = session.get("workflow")
    if not workflow:
        raise HTTPException(status_code=400, detail="Ingen workflow tilldelad för användaren.")
    assistants = model.get_workflow(workflow)
    return {"workflow": workflow, "assistants": assistants}

@app.post("/api")
async def api_response(data: dict):
    return JSONResponse(content=data)

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile):
    try:
        file_content = await file.read()
        if file.filename.endswith(".pdf"):
            model.load_pdf(file_content)
        elif file.filename.endswith(".docx"):
            model.load_word(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        return {"message": "File uploaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/new_chat")
async def new_chat(request: Request):
    request.scope["session"].clear()
    model.new_chat()
    return {"message": "New chat started."}

@app.get("/get_case/{case_id}")
async def get_case(case_id: str):
    try:
        case_details = model.get_case(case_id)
        return case_details
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

class CaseIDsRequest(BaseModel):
    case_ids: list[str]

@app.post("/rattsutredningsformat")
async def rattsutredningsformat(request: Request, data: CaseIDsRequest):
    workflow_name = request.scope.get("session", {}).get("workflow", get_next_workflow())
    if not workflow_name:
        raise HTTPException(status_code=400, detail="Ingen workflow tilldelad för användaren.")
    try:
        result = await model.rattsutredningsformat(data.case_ids, workflow_name)
        return {"utredning": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/juridiskargumentation")
async def juridisk_argumentation(request: Request, data: CaseIDsRequest):
    workflow_name = request.scope.get("session", {}).get("workflow", get_next_workflow())
    if not workflow_name:
        raise HTTPException(status_code=400, detail="Ingen workflow tilldelad för användaren.")
    try:
        result = await model.juridisk_argumentation(data.case_ids, workflow_name)
        return {"argumentation": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/chatbot")
async def chatbot(request: Request, chat_request: ChatRequest):
    message = chat_request.message
    workflow_name = request.scope.get("session", {}).get('workflow', get_next_workflow())
    api_key = request.scope.get("session", {}).get('api_key', get_next_api_key())

    model.set_api_key(api_key)
    try:
        final_response, case_ids, summaries = await model.send_prompt_to_all_models(
            message, workflow_name
        )
        return {
            "response": final_response,
            "case_ids": case_ids,
            "summaries": summaries,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))