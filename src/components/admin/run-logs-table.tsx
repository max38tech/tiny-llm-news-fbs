
'use client';

import type { PipelineRun } from '@/lib/firebase/service';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RunLogsTable({ runLogs }: { runLogs: PipelineRun[] }) {
  const [selectedLog, setSelectedLog] = useState<PipelineRun | null>(null);

  const getStatusVariant = (status: PipelineRun['status']) => {
    switch (status) {
      case 'Success':
        return 'default';
      case 'Partial Success':
        return 'secondary';
      case 'Failure':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Articles Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{new Date(log.runAt).toLocaleString()}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                </TableCell>
                <TableCell>{log.articlesAdded}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Log</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pipeline Log</DialogTitle>
            <DialogDescription>
              Log from run on {selectedLog ? new Date(selectedLog.runAt).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="h-96 w-full mt-4">
              <div className="p-4 bg-muted/50 rounded-lg text-xs font-mono space-y-1">
                {selectedLog.log.map((line, index) => (
                  <p key={index} className={cn({ 'text-destructive': line.includes('ERROR') || line.includes('FAILED') })}>
                    {line}
                  </p>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
