import React from 'react'


const LoadingIndicator = () => {
  return (
    <div className="h-10 w-10 rotate-45	 text-blue-500 mx-auto">
        <div className="h-full bg-blue-500 animate-pulse" style={{ width: "100%" }}></div>
    </div>
  )
}

export default LoadingIndicator