import { useNavigate } from "react-router-dom";
import StartMenu from "../components/StartMenu";
import BoardList from "../components/BoardList";
function StartPage() {
  return (
    <div>
      <StartMenu/>
      <BoardList/>
    </div>
  );
}

export default StartPage;