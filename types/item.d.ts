export interface Item {
  label: string;
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined;
  disabled?: boolean;
}
