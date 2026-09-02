export const FIGURE_TITLE_PLACEHOLDER = "タイトルを入力";
export const FIGURE_TITLE_ASSIST_MSG = "タイトルを入力してください";

type Props = {
  show: boolean;
};

export function FigureTitleAssist({ show }: Props) {
  if (!show) return null;
  return (
    <span className="figure-title-assist" role="status">
      {FIGURE_TITLE_ASSIST_MSG}
    </span>
  );
}
