import { Fragment } from "react";
import ModelGroup from "./ModelGroup";

export default function ModelList({
  models,
  currentModel,
  changeModel,
}: {
  models: string[],
  currentModel: string,
  changeModel: (model: string) => void,
}) {
  const groups = models.map((model) => model.split("/")[0])
                      .filter((elem, index, arr) => arr.indexOf(elem) == index);

  return (
    <Fragment>
    {groups.map((group, index) => (
      <ModelGroup
        key={group}
        group={group}
        models={models.filter((model) => model.startsWith(group))}
        currentModel={currentModel}
        changeModel={changeModel}
      />
    ))}
    </Fragment>
  );
}