/* =========================
   配列に要素を追加する汎用ハンドラ
   ========================= */
export const createAddHandler = <T,>(
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    onChange?: (items: T[]) => void
    ) => {
        return (newItem: T) => {
            setList((prev) => {
            const updated = [...prev, newItem];
            onChange?.(updated);
            return updated;
            });
        };
    };
      
      