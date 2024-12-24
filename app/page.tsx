"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import LoadingIndicator from "@/components/loading-indicator";
import FileUploader from "@/components/fileUpload";
import EpmtyChatScreen from "@/components/EpmtyChatScreen";
import SideBar from "@/components/SideBar";


export default function Page() {
  const [sidebarVisible, setSidebarVisible] = useState(false); // Kontrollera sidofältets synlighet
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  // Funktion för att skicka meddelande och hämta svar
  const handleSendMessage = async () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { role: "user", content: input }]);
      setInput(""); // Töm input-fältet direkt
      setIsLoading(true); // Starta laddningsindikatorn
  
      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input }),
        });
  
        const data = await res.json();
        let aiResponse = data.response;
  
        // Ta bort input från AI-svaret om det upprepas
        if (aiResponse.includes(input)) {
          aiResponse = aiResponse.replace(input, "").trim();
        }
  
        setMessages((prev) => [
          ...prev,
          { role: "stice", content: aiResponse },
        ]);
  
        setSidebarVisible(true); // Visa sidebar efter första AI-svaret
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          { role: "stice", content: "Ett fel uppstod. Försök igen." },
        ]);
      } finally {
        setIsLoading(false); // Stoppa laddningsindikatorn
      }
    }
  };

  return (
      <div className="text-black dark:text-white relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden">
        <div className="group w-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] bg-muted/50">
        {/* Sidofält - Dölj tills AI genererat svar */}
        {sidebarVisible && (
          <SideBar/>
        )}


        {/* Huvudpanel */}
        <div className="flex-1 flex flex-col p-4 ">
          {/* Välkomstmeddelande */}
          {messages.length === 0 && (
            <EpmtyChatScreen />
          )}

          {/* Chatbox */}
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="pb-[200px] pt-4 md:pt-10">
              <div className="relative mx-auto max-w-2xl px-4">
                {messages.map((msg, index) => (
                  <div key={index}>
                    {/* Användarens meddelande */}
                    {msg.role === "user" && (
                      <div>
                        <div className="group relative flex items-start md:-ml-12">
                          <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border border-[#5c7cf4] bg-primary text-primary-foreground shadow-sm">
                            <svg
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              role="img"
                              xmlns="http://www.w3.org/2000/svg"
                              className="size-4"
                            >
                              <title>User</title>
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                            </svg>
                          </div>
                          <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
                            <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                              <p className="mb-2 last:mb-0">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                        <div data-orientation="horizontal" role="none" className="shrink-0 bg-border border-[#5c7cf4] h-[1px] w-full my-4"></div>
                      </div>
                    )}

                    {/* AI:s meddelande */}
                    {msg.role === "stice" && (
                      <div>
                        <div className="group relative flex items-start md:-ml-12">
                          <div className="flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border border-[#5c7cf4] bg-background shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 256 256"
                              fill="currentColor"
                              className="size-4"
                            >
                              <line x1="0" y1="10" x2="250" y2="10" style={{stroke:"blue", strokeWidth:"6",rotate:"45"}} />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
                            <ReactMarkdown className="prose dark:prose-invert mb-2 last:mb-0">
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div data-orientation="horizontal" role="none" className="shrink-0 bg-border border-[#5c7cf4] h-[1px] w-full my-4"></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Laddningsindikator - Visas endast i botten under AI-svaret */}
                {isLoading && (
                  <div className="flex items-center justify-center mt-4">
                    <LoadingIndicator />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Inputfält */}
          <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
            <div className="mx-auto sm:max-w-2xl sm:px-4">
              <div className="space-y-4 border-t border-[#5c7cf4] bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
              <form onSubmit={handleSendMessage}>
                <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
                <FileUploader />

                  <button
                    type="button"
                    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[#5c7cf4] border-input shadow-sm hover:bg-accent hover:text-accent-foreground absolute left-0 top-4 size-8 rounded-full bg-background p-0 sm:left-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className="size-4">
                      <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8Z"></path>
                    </svg>
                    <span className="sr-only">Upload file</span>
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message..."
                    className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Förhindra default-formulärskick
                        handleSendMessage();
                      }
                    }}
                  />

                  <div className="absolute right-0 top-4 sm:right-4">
                    <button
                      onClick={handleSendMessage} // Säkerställ att event skickas
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 size-9"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className="size-4">
                        <path d="M200 32v144a8 8 0 0 1-8 8H67.31l34.35 34.34a8 8 0 0 1-11.32 11.32l-48-48a8 8 0 0 1 0-11.32l48-48a8 8 0 0 1 11.32 11.32L67.31 168H184V32a8 8 0 0 1 16 0Z"></path>
                      </svg>
                      <span className="sr-only">Send message</span>
                    </button>
                  </div>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
