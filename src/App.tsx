import NewRender from "./NewRender";
import OldRender from "./OldRender";

function App() {
  const useNewRender = true;
  return useNewRender ? <NewRender /> : <OldRender />;
}

export default App;
