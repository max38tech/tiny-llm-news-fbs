
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
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPipelineRunLogs as getPipelineRunLogsFromDb } from '@/lib/firebase/service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

export function RunLogsTable() {
  const { toast } = useToast();
  const [runLogs, setRunLogs] = useState<PipelineRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<PipelineRun | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const logs = await getPipelineRunLogsFromDb();
        setRunLogs(logs);
      } catch (error) {
        console.error("Failed to fetch run logs:", error);
        toast({
          title: "Error",
          description: "Could not load run logs from the database.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [toast]);

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

  if (isLoading) {
    return (
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
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-4" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-10 inline-block" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
  }

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
