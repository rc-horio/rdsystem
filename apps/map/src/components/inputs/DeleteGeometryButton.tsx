// src/components/inputs/DeleteGeometryButton.tsx

import React from "react";

interface DeleteGeometryButtonProps {
  onClick: () => void;
  height?: number;
}

const DeleteGeometryButton: React.FC<DeleteGeometryButtonProps> = ({
  onClick,
  height = 25,
}) => {
  return (
    <button onClick={onClick} style={{ height: `${height}px` }}>
      ジオメトリを削除
    </button>
  );
};

export default DeleteGeometryButton;
