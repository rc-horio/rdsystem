import React from "react";
import { createAddHandler } from "../utils/createAddHandler";


/* =========================
   追加ハンドラー
   ========================= */
export function useAddHandler<T>(
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    onChange?: (items: T[]) => void
    ) {
    // setList / onChange が変わらない限り参照を安定化
    return React.useMemo(
        () => createAddHandler(setList, onChange),
        [setList, onChange]
    );
}
      