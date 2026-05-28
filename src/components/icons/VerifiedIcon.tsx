import { IconProps } from "./types"; // importando as especificações 

const VerifiedIcon = ({ size = 24, ...props }: IconProps) => {
  return (
      <svg className="verified-icon" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 0c-8.837 0-16 7.163-16 16s7.163 16 16 16 16-7.163 16-16-7.163-16-16-16zm-2.223 23.334l-6.366-6.366 2.121-2.121 4.245 4.245 8.489-8.489 2.121 2.121-10.61 10.61z" />
  </svg>
  );
};

export default VerifiedIcon;