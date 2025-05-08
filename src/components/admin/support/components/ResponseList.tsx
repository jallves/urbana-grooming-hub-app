
import React from 'react';
import { TicketResponse } from '@/types/support';

interface ResponseListProps {
  responses: TicketResponse[];
  formatDate: (dateString: string) => string;
  getResponderName: (response: TicketResponse) => string;
}

const ResponseList: React.FC<ResponseListProps> = ({ responses, formatDate, getResponderName }) => {
  if (responses.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Nenhuma resposta ainda.</p>;
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <div key={response.id} className="bg-muted/50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span className="font-medium">
              {getResponderName(response)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(response.created_at)}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{response.response_text}</p>
        </div>
      ))}
    </div>
  );
};

export default ResponseList;
