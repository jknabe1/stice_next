import React from 'react'
import { ModeToggle } from '@/components/theme-toggle' 
import Link from 'next/link'

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
        <div className="flex items-center">
          <Link href={"/"} className='text-3xl text-[#5c7cf4]'>stice</Link>
          <svg fill="none" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" viewBox="0 0 24 24" aria-hidden="true" className="size-6 text-muted-foreground/50">
            <path d="M16.88 3.549L7.12 20.451"></path>
          </svg>
          <div className="flex items-center justify-between">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 pl-0" type="button">
              <div className="flex size-7 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">{/*user.image || user.initials*/}u.s</div>
              <span className="ml-2 hidden md:block">user.name</span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2">
            <ModeToggle />
        </div>
    </header>
  )
}
