import React from 'react'

export default function SideBar() {
  return (
    <div>
        <div className="peer absolute inset-y-0 z-30 border-r border-[#5c7cf4] bg-muted duration-300 ease-in-out lg:flex lg:w-[250px] xl:w-[300px] h-full flex-col dark:bg-zinc-950">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-4">
                        <h2 className="text-lg font-semibold mb-4">Matching docs</h2>
                      </div>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-auto">
                          <div className="p-8 text-center">
                            <p className="text-sm text-muted-foreground">Found 0 matching documents</p>
                          </div>
                        </div>
                        <div className="mb-2 px-2">
                          <a className="inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:text-accent-foreground py-2 h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10" href="/">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className="size-4 -translate-x-2 stroke-2">
                              <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8Z"></path>
                            </svg>
                              New Chat
                          </a>
                        </div>
                        <div className="flex items-center justify-between p-4">
                          © Stice Legal AB 2025
                        </div>
                      </div>
                    </div>
                  </div>
    </div>
  )
}
