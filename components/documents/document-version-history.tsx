'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  RotateCcw, 
  Clock, 
  User, 
  Tag,
  Eye,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: any;
  change_summary: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  currentContent: any;
  currentSections: any[];
  onRestoreVersion: (sections: any[], title: string) => void;
}

export function DocumentVersionHistory({
  documentId,
  currentContent,
  currentSections,
  onRestoreVersion,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [documentId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: DocumentVersion) => {
    if (!version.content) return;
    
    try {
      const sections = version.content.sections || [];
      const title = version.content.title || 'Untitled';
      
      onRestoreVersion(sections, title);
      toast.success(`Restored to version ${version.version_number}`);
      setShowPreview(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const handlePreview = (version: DocumentVersion) => {
    setSelectedVersion(version);
    setShowPreview(true);
  };

  const toggleExpand = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  const renderVersionPreview = (version: DocumentVersion) => {
    const sections = version.content?.sections || [];
    const title = version.content?.title || 'Untitled';
    
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="space-y-3">
            {sections.slice(0, 3).map((section: any, idx: number) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-3">
                <h4 className="font-medium text-sm">{section.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {section.content?.substring(0, 150)}...
                </p>
              </div>
            ))}
            {sections.length > 3 && (
              <p className="text-xs text-muted-foreground italic">
                + {sections.length - 3} more sections
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{sections.length} sections</span>
          <span>
            {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
          <CardDescription className="text-xs">
            View and restore previous versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No version history yet</p>
                <p className="text-xs mt-1">Versions are saved when you make changes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(version.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={index === 0 ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              v{version.version_number}
                            </Badge>
                            {version.change_summary?.includes('AI') && (
                              <Badge variant="outline" className="text-xs bg-purple-50">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm font-medium">
                            {version.change_summary || 'Document updated'}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.created_by_name || 'You'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(version.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {expandedVersion === version.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expandedVersion === version.id && (
                      <div className="px-3 pb-3 border-t bg-muted/20">
                        <div className="pt-3">
                          {renderVersionPreview(version)}
                          
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handlePreview(version)}
                            >
                              <Eye className="h-3 w-3 mr-2" />
                              Full Preview
                            </Button>
                            {index !== 0 && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleRestore(version)}
                              >
                                <RotateCcw className="h-3 w-3 mr-2" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version {selectedVersion?.version_number} Preview
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.change_summary} •{' '}
              {selectedVersion &&
                formatDistanceToNow(new Date(selectedVersion.created_at), {
                  addSuffix: true,
                })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg border">
                <h2 className="text-2xl font-bold mb-6">
                  {selectedVersion.content?.title || 'Untitled'}
                </h2>
                
                <div className="space-y-6">
                  {selectedVersion.content?.sections?.map((section: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {section.title}
                      </h3>
                      <div className="pl-8 text-sm text-muted-foreground whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {selectedVersion.created_by_name || 'You'}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleRestore(selectedVersion)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore This Version
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
