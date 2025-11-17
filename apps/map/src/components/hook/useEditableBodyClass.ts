// src/pages/parts/hook/useEditableBodyClass.ts
import { useEffect, useState } from "react";

// Bodyクラスで編集状態を共有（editing-on で活性）
const getEditable = () => document.body.classList.contains("editing-on");

export function useEditableBodyClass() {
    const [editable, setEditable] = useState<boolean>(getEditable);

    useEffect(() => {
        const update = () => setEditable(getEditable());
        update();
        const mo = new MutationObserver(update);
        mo.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => mo.disconnect();
    }, []);

    return editable;
}
