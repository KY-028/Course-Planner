import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Vite + React</h1>
      <p className='text-blue-500 text-2xl font-bold'>Note from Kevin: This is proof you can now code and use tailwind</p>
    </>
  );
}

export default App;