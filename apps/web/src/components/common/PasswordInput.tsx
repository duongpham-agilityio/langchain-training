import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from './Input.tsx';
import IconButton from './IconButton.tsx';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

const PasswordInput = (props: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      {...props}
      type={isVisible ? 'text' : 'password'}
      rightSlot={
        <IconButton
          icon={isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          onClick={() => setIsVisible((visible) => !visible)}
        />
      }
    />
  );
};

export default PasswordInput;
