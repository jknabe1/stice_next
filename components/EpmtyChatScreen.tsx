import React from 'react'

export default function EpmtyChatScreen() {
  return (
    <div>
        <div className="pb-[200px] pt-4 md:pt-10">
              <div className="mx-auto max-w-2xl px-4">
                <div className="flex flex-col gap-2 rounded-lg border border-[#5c7cf4] bg-background p-8">
                  <h1 className="text-lg font-semibold">
                    Welcome to Stice AI user.name
                  </h1>
                  <p className="leading-normal">
                    You can ask me things like:
                    <br /> “...”
                    <br /> “...”
                  </p>
                </div>
              </div>
        </div>
    </div>
  )
}
