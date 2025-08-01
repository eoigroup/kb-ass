import Home from './home'
// Updated: 2025-01-08 19:20:00 - Fixed assistant availability check for new Home component

// This app allows you to optionally disable sharing the Assistant's files and providing citations, via the 
// environment variables SHOW_ASSISTANT_FILES, SHOW_CITATIONS, and SHOW_MODELS.

// This page.tsx is a server component, which allows us to read the values of the environment variables and pass them 
// to the Home component, which is a client component (intended to run on the client and use Browser API's). 
// The client component is responsible for rendering the UI, and needs to know the values of the environment variables

async function checkAssistantAvailability() {
  try {
    // Check if required environment variables are set
    const hasApiKey = !!process.env.PINECONE_API_KEY;
    const hasAssistantName = !!process.env.PINECONE_ASSISTANT_NAME;
    
    if (!hasApiKey || !hasAssistantName) {
      console.log('Missing required environment variables:', { hasApiKey, hasAssistantName });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking assistant availability:', error);
    return false;
  }
}

export default async function Page() {
  const showAssistantFiles = process.env.SHOW_ASSISTANT_FILES === 'true'
  const isAssistantAvailable = await checkAssistantAvailability();
  
  return <Home initialShowAssistantFiles={showAssistantFiles} isAssistantAvailable={isAssistantAvailable} />
}