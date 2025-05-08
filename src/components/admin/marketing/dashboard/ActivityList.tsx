
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActivityItem {
  event: string;
  time: string;
  value: string;
}

interface ActivityListProps {
  activities: ActivityItem[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-start px-2 py-1">
              <div className="mr-2 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{activity.event}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                  <Badge variant="outline" className="text-xs">
                    {activity.value}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityList;
