import Image from "next/image";
import { Fragment } from "react";

export default function ModelGroupImage({
  model_id,
  height,
}: {
  model_id: string,
  height?: string,
}) {
  const model_group = model_id.split("/")[0];
  const model_group_image = model_group == "LGAI-EXAONE" ? "exaone.webp" :
                            model_group == "naver-hyperclovax" ? "hyperclovax.png" :
                            model_group == "meta-llama" ? "meta.png" :
                            model_group == "CohereLabs" ? "cohere.png" :
                            model_group == "Qwen" ? "qwen.png" : undefined;
  return (
    <Fragment>
    {model_group_image &&
      <Image
        src={"/models/" + model_group_image}
        alt={model_group}
        width={132}
        height={34}
        style={{
          minHeight: height || "34px",
          maxHeight: height || "34px",
          width: "auto",
        }}
      />
    }
    </Fragment>
  );
}