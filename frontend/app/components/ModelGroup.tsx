import { Fragment } from "react";
import ModelButton from "./ModelButton";

export default function ModelGroup({
  group,
  models,
  currentModel,
  changeModel,
}: {
  group: string,
  models: string[],
  currentModel: string,
  changeModel: (model: string) => void,
}) {
  return (
    <Fragment>
    {models.map((model) =>
      <ModelButton
        key={model}
        model={model}
        currentModel={currentModel}
        changeModel={changeModel}
      />
    )}
    </Fragment>
  );
}