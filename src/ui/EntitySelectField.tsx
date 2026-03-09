import { ChangeEventHandler, ReactNode } from 'react'
import SelectField from './SelectField'

type EntityOption = {
  id: string
  name: string
}

type EntitySelectFieldProps = {
  label: string
  value: string
  onChange: ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  id: string
  name: string
  placeholder: string
  options: EntityOption[]
  helperText?: ReactNode
  ariaLabel?: string
}

export default function EntitySelectField({
  label,
  value,
  onChange,
  disabled,
  id,
  name,
  placeholder,
  options,
  helperText,
  ariaLabel,
}: EntitySelectFieldProps) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      id={id}
      name={name}
      helperText={helperText}
      aria-label={ariaLabel}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </SelectField>
  )
}
