
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

interface PrioritySelectProps {
  value: Priority;
  onChange: (value: Priority) => void;
}

const PrioritySelect: React.FC<PrioritySelectProps> = ({ value, onChange }) => {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Baixa':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'Média':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'Alta':
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case 'Urgente':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const renderPriorityBadge = (priority: Priority) => (
    <Badge variant="outline" className={`${getPriorityColor(priority)} border-0`}>
      {priority}
    </Badge>
  );

  return (
    <Select value={value} onValueChange={(val) => onChange(val as Priority)}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione a prioridade">
          {value && renderPriorityBadge(value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Baixa">
          {renderPriorityBadge('Baixa')}
        </SelectItem>
        <SelectItem value="Média">
          {renderPriorityBadge('Média')}
        </SelectItem>
        <SelectItem value="Alta">
          {renderPriorityBadge('Alta')}
        </SelectItem>
        <SelectItem value="Urgente">
          {renderPriorityBadge('Urgente')}
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default PrioritySelect;
