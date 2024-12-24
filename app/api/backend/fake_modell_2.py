import openai
import os
from dotenv import load_dotenv
import asyncio
import time
import re
import PyPDF2  # För att läsa PDF-filer
from docx import Document
import pandas as pd
import jsonify


class FakeModel:
    def __init__(self) -> None:
        self.df = pd.read_csv("../")
        load_dotenv()
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        self.conversation_memory = []  # Variabel för att spara konversationen
        self.workflows = {
            "workflow_1": ["asst_H3aOLOyRbc0EtDaCyFlJ9SXH", "asst_qErraLsKdRwbr36EoCxMV4q6", "asst_SzIEcriyFRQmCeVE8mipCmyG", "asst_CatYmZyKf7hDmqvJwcOjxcTH", "asst_r682XHHitruCZh1bRlM5EBhr", "asst_T4N445YGJfx5gqBk8uQ0hApN", "asst_K255mh2ZBOx5N0JiGnE4Qqxk", "asst_9icQL0mbZvTg8J5pDXrYQaek", "asst_JNkOeSebPvLEn3tWXj7dmqXM", "asst_WdtxckS4ilzw8ByM2nVya4Rz", "asst_SnvDG7HCH4VKhYNhY1JMnvfy"],
            "workflow_2": ["asst_H3aOLOyRbc0EtDaCyFlJ9SXH", "asst_qErraLsKdRwbr36EoCxMV4q6", "asst_SzIEcriyFRQmCeVE8mipCmyG", "asst_CatYmZyKf7hDmqvJwcOjxcTH", "asst_r682XHHitruCZh1bRlM5EBhr", "asst_T4N445YGJfx5gqBk8uQ0hApN", "asst_K255mh2ZBOx5N0JiGnE4Qqxk", "asst_9icQL0mbZvTg8J5pDXrYQaek", "asst_JNkOeSebPvLEn3tWXj7dmqXM", "asst_WdtxckS4ilzw8ByM2nVya4Rz", "asst_SnvDG7HCH4VKhYNhY1JMnvfy"]
        }
        
        self.pdf_content = ""
        self.word_content = ""


    def get_workflow(self, workflow_name):
        """
        Returnerar listan av assistenter för ett specifikt workflow.
        """
        return self.workflows.get(workflow_name, [])
    
    def set_api_key(self, api_key):
        """
        Sätt API-nyckeln dynamiskt.
        """
        openai.api_key = api_key
    

    def load_pdf(self, file_path: str) -> str:
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                pdf_text = ""
                for page_num in range(len(reader.pages)):
                    pdf_text += reader.pages[page_num].extract_text()
            self.pdf_content = pdf_text  # Spara PDF-innehållet i instansvariabeln
            return "PDF content loaded"
        except Exception as e:
            return f"Error reading PDF: {e}"
        
    def load_word(self, file_path: str) -> str:
        try:
            doc = Document(file_path)
            doc_text = "\n".join([para.text for para in doc.paragraphs])
            return doc_text
        except Exception as e:
            return f"Error reading Word document: {e}"

    def new_chat(self):
        # Funktion för att starta en ny chatt
        self.conversation_memory = []
        self.pdf_content = ""  # Rensa PDF-innehållet
        self.word_content = ""  # Rensa Word-innehållet
        print("A new chat has been started.")

    def prompt_creator(self, user_input: str) -> str:
        # Lägg till tidigare konversation till prompten
        memory_as_text = "\n".join(self.conversation_memory)
        prompt = f"{memory_as_text}\nUser: {user_input}\nAssistant:"
        return prompt

    async def send_prompt(self, assistant_id, prompt):
        """
        Skickar en prompt till den angivna assistenten och returnerar svaret.
        """
        try:
            thread = await asyncio.to_thread(openai.beta.threads.create)
            thread_id = thread.id

            message = await asyncio.to_thread(
                openai.beta.threads.messages.create,
                thread_id=thread_id,
                role="user",
                content=prompt
            )

            run = await asyncio.to_thread(
                openai.beta.threads.runs.create,
                thread_id=thread_id,
                assistant_id=assistant_id
            )

            while run.status != "completed":
                await asyncio.sleep(5)
                run = await asyncio.to_thread(
                    openai.beta.threads.runs.retrieve,
                    thread_id=thread_id,
                    run_id=run.id
                )

            response = await asyncio.to_thread(
                openai.beta.threads.messages.list,
                thread_id=thread_id
            )
            

            return response.data[0].content[0].text.value
        except Exception as e:
            return f"Error occurred: {str(e)}"
        

    async def send_prompt_to_all_models(self, user_input, workflow_name, file_path=None, file_type=None):
        """
        Huvudfunktion för att köra arbetsflödet genom alla modeller i det angivna workflowet.
        """
        try:
            # Hämta assistenter för det specifika workflowet
            assistants = self.get_workflow(workflow_name)
            if not assistants:
                return f"Inga assistenter tillgängliga för workflow {workflow_name}.", [], []

            # Hantera filinnehåll om en fil laddas upp
            if file_path and file_type:
                if file_type.lower() == "pdf":
                    load_status = self.load_pdf(file_path)
                elif file_type.lower() == "word":
                    load_status = self.load_word(file_path)
                else:
                    return "Unsupported file type.", [], []
                print(load_status)

            # Steg 1: Frågeanalys med Modell 1
            document_content = self.pdf_content or self.word_content
            prompt_1 = f"Analysera följande fråga och dokument för att skapa en JSON-struktur:\nFråga: {user_input}\nDokumentinnehåll:\n{document_content}"
            structured_query = await self.send_prompt(assistants[0], prompt_1)
            print(f"Output från Modell 1")
            await asyncio.sleep(0.5)

            # Steg 2: Sök relevanta rättsfall med Modell 2
            prompt_2 = f"Sök efter relevanta rättsfall baserat på:\n{structured_query}"
            initial_cases = await self.send_prompt(assistants[1], prompt_2)
            print(f"Output från Modell 2")
            await asyncio.sleep(0.5)

            # Steg 3: Validera och filtrera med Modell 3
            prompt_3 = f"Validera och identifiera fler relevanta rättsfall baserat på:\n{structured_query}\n\nHär är initiala rättsfall:\n{initial_cases}"
            expanded_cases = await self.send_prompt(assistants[2], prompt_3)
            print(f"Output från Modell 3")
            await asyncio.sleep(0.5)

            # Steg 4: Slutgiltig validering med Modell 4
            prompt_4 = f"Validera dessa rättsfall baserat på relevanta lagar:\n{expanded_cases}\n\n och detta är användares fråga: \n{structured_query}\n"
            final_results = await self.send_prompt(assistants[3], prompt_4)
            print(f"Output från Modell 4")
            await asyncio.sleep(0.5)

            # Steg 5: Slutgiltig validering med Modell 4
            prompt_5 = f"Validera och identifiera flera relevanta lagar baserat på dessa rättsfall:\n{final_results}"
            final_results_2 = await self.send_prompt(assistants[4], prompt_5)
            print(f"Output från Modell 5")
            await asyncio.sleep(0.5)

            # Steg 6: Utöka och validera med Modell 5
            prompt_6 = f"Validera dessa rättsfall baserat på relevanta sou och propositioner:\n{final_results_2}"
            enhanced_results = await self.send_prompt(assistants[5], prompt_6)
            print(f"Output från Modell 6")
            await asyncio.sleep(0.5)

            # Steg 7: Utöka och validera med Modell 5
            prompt_7 = f"Validera och identifiera flera relevanta sou och propositioner baserat på dessa rättsfall:\n{enhanced_results}"
            enhanced_results_2 = await self.send_prompt(assistants[6], prompt_7)
            print(f"Output från Modell 7")
            await asyncio.sleep(0.5)

            # Extrahera summering och case-IDs
            summaries = self.extract_summaries(enhanced_results_2)
            case_ids = self.extract_case_ids(enhanced_results_2)

            return enhanced_results_2, case_ids, summaries
        except Exception as e:
            return f"Error in workflow: {str(e)}", [], []


    def clean_respond(self, respond):
        text = respond[0].text.value
        cleaned_text = re.sub(r'【.*?】', '', text)
        return cleaned_text

    def format_response(self, response_text):
        cases = response_text.split("Id:")

        formatted_cases = []
        for case in cases:
            if case.strip():
                formatted_case = case.strip()

                # Lägg till radbrytningar och starka taggar för varje nyckelord
                for keyword in ["Id", "Relevansprocent", "Utfall", "Sammanfattning", "Avgörande faktorer", "Referens"]:
                    formatted_case = formatted_case.replace(f"{keyword}:", f"<br><strong>{keyword}:</strong> ")

                # Lägg till <p> och <br> för att bryta varje case korrekt
                formatted_cases.append(f"<p>{formatted_case}</p><br>")

        # Returnera en HTML-sträng som inkluderar alla case 
        return "".join(formatted_cases)
    
    
    def extract_case_ids(self, text):
        pattern = r"(?<=\*\*Id\*\*:\s)([A-ZÅÄÖ]{0,4}\d{1,6}-\d{1,4})(?=\s*-?\s*\*\*Domstol\*\*)"
        case_ids = re.findall(pattern, text, re.IGNORECASE)
        return case_ids
    

    def extract_summaries(self, text):
        # Regex för att matcha text mellan '**Sammanfattning**:' och '**Utfall**:'
        pattern = r"(?<=\*\*Sammanfattning\*\*:\s)(.*?)(?=\s*-?\s*\*\*Utfall\*\*)"
        summaries = re.findall(pattern, text, re.DOTALL)  # re.DOTALL för att inkludera radbrytningar
        return [summary.strip() for summary in summaries]  # Ta bort onödiga mellanslag runt texten


    def get_case(self, case_id):
        row = self.df[self.df["id"] == case_id]
        if row.empty:
            raise ValueError("Case ID not found")

        row = row.fillna('')  # Ersätt NaN med tomma strängar
        return row.to_dict(orient="records")[0]


    async def rattsutredningsformat(self, list_of_case_id, workflow_name):
        try:
            utredning = []

            # Hämta assistenter för workflowet
            assistants = self.get_workflow(workflow_name)
            if not assistants:
                return f"Inga assistenter tillgängliga för workflow {workflow_name}.", [], []

            print("Starta skapa rättsutredning")
            for case_id in list_of_case_id:
                print("case behandlas")
                case_data = self.get_case(case_id)
                if not case_data:
                    continue  # Hoppa över om case ID inte hittas
                
                # Skapa GPT-prompt för rättsutredningen
                prompt = f"""
                    Skapa en rättsutredning för följande rättsfall:
                    ID: {case_data['id']}
                    Domstol: {case_data['domstol']}
                    Datum: {case_data['avgorande datum']}
                    Innehåll: {case_data['r referat']}
                """

                # Använd den sista assistenten i listan (ändra vid behov)
                gpt_response = await self.send_prompt(assistants[-4], prompt)  # Använder sista assistenten
                if gpt_response:
                    utredning.append(gpt_response)

            # Sammanställ alla rättsutredningar till en enda text
            final_utredning = "\n\n".join(utredning)
            final_prompt = f"Detta är alla rättsfallsutredningar: \n{final_utredning}"
            final_respons = await self.send_prompt(assistants[-3], final_prompt)
            print("alla case behandlade och sammanställs")
            return final_respons
        except Exception as e:
            return str(e)
        

    async def juridisk_argumentation(self, list_of_case_id, workflow_name):
        try:
            utredning = []

            # Hämta assistenter för workflowet
            assistants = self.get_workflow(workflow_name)
            if not assistants:
                return f"Inga assistenter tillgängliga för workflow {workflow_name}.", [], []

            print("Starta skapa juridisk argumentation")
            for case_id in list_of_case_id:
                print("case behandlas")
                case_data = self.get_case(case_id)
                if not case_data:
                    continue  # Hoppa över om case ID inte hittas
                
                # Skapa GPT-prompt för rättsutredningen
                prompt = f"""
                    Skapa en juridisk argumentation för följande rättsfall:
                    ID: {case_data['id']}
                    Domstol: {case_data['domstol']}
                    Datum: {case_data['avgorande datum']}
                    Innehåll: {case_data['r referat']}
                """

                # Använd den sista assistenten i listan (ändra vid behov)
                gpt_response = await self.send_prompt(assistants[-2], prompt)  # Använder sista assistenten
                if gpt_response:
                    utredning.append(gpt_response)

            # Sammanställ alla rättsutredningar till en enda text
            final_utredning = "\n\n".join(utredning)
            final_prompt = f"Detta är alla juridisk argumentation: \n{final_utredning}"
            final_respons = await self.send_prompt(assistants[-1], final_prompt)
            print("alla case behandlade och sammanställs")
            return final_respons
        except Exception as e:
            return str(e)