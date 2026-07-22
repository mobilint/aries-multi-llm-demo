import { Grid2 } from "@mui/material";
import Sidebar from "./Sidebar";
import { LLMClient } from "./type";
import Main from "./Main";

export default function Chatting({
  models,
  client,
  setCurrentDevNo,
  ask,
  abort,
  reset,
}: {
  models: string[],
  client: LLMClient,
  setCurrentDevNo: (dev_no: number | null) => void,
  ask: (question: string) => void,
  abort: () => void,
  reset: () => void,
}) {
  const handleReset = () => {
    abort();
    reset();
  };
  
  const changeModel = (model: string) => {
    if (model == client.model_id) {
      return;
    }

    const dev_no = models.findIndex((m) => m == model);
    if (dev_no == -1) {
      console.log("Model not found", model, models);
      return;
    }
    
    abort();
    reset();
    setCurrentDevNo(dev_no);
  };

  return (
    <Grid2
      container
      direction="row"
      justifyContent="center"
      alignItems="stretch"
      sx={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Sidebar
        models={models}
        client={client}
        reset={handleReset}
        changeModel={changeModel}
        setCurrentDevNo={setCurrentDevNo}
      />
      <Grid2
        container
        size="grow"
        alignItems="stretch"
      >
        <Main
          client={client}
          modelCount={models.length}
          ask={ask}
          abort={abort}
        />
      </Grid2>
    </Grid2>
  );
}
