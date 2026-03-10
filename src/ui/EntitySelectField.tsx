import { ReactNode } from 'react'
import SearchableSelectField from './SearchableSelectField'

type EntityOption = {
  id: string
  name: string
  description?: string
}

type EntitySelectFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
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
  loading,
  id,
  name,
  placeholder,
  options,
  helperText,
  ariaLabel,
}: EntitySelectFieldProps) {
  return (
    <SearchableSelectField
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      loading={loading}
      id={id}
      name={name}
      placeholder={placeholder}
      options={options.map((option) => ({
        value: option.id,
        label: option.name,
        description: option.description,
        searchText: `${option.name} ${option.id}`,
      }))}
      helperText={helperText}
      ariaLabel={ariaLabel}
    />
  )
}
