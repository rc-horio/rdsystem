type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function InputBox({ className = "", ...props }: Props) {
  return <input {...props} className={`ui-input ${className}`} />;
}
