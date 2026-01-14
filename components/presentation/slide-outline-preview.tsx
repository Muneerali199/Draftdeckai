"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  List, 
  BarChart3, 
  Image as ImageIcon, 
  Users, 
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Brain,
  Target,
  TrendingUp,
  Eye,
  PieChart,
  LineChart,
  Activity,
  Camera,
  Palette,
  Edit3,
  Save,
  X,
  Plus,
  Trash2
} from "lucide-react";
import Image from "next/image";

interface SlideOutline {
  title: string;
  type: string;
  description: string;
  content?: string;
  bullets?: string[];
  chartData?: any;
  imageQuery?: string;
  imageUrl?: string;
  // Premium slide properties
  stats?: { value: string; label: string; context?: string; trend?: string }[];
  comparison?: { 
    leftTitle?: string; 
    left?: string[]; 
    rightTitle?: string; 
    right?: string[]; 
    highlight?: string;
  };
  timeline?: { date: string; title: string; description?: string; icon?: string }[];
  icons?: { icon: string; label: string; description?: string }[];
  mockup?: { type: string; title?: string; elements: { type: string; content: string }[] };
  testimonial?: { quote: string; author: string; role?: string; company?: string };
  logos?: string[];
  cta?: string;
}

interface SlideOutlinePreviewProps {
  outlines: SlideOutline[];
  onOutlinesUpdate?: (updatedOutlines: SlideOutline[]) => void;
  editable?: boolean;
}

export function SlideOutlinePreview({ outlines, onOutlinesUpdate, editable = true }: SlideOutlinePreviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedOutlines, setEditedOutlines] = useState<SlideOutline[]>(outlines);
  const [localOutline, setLocalOutline] = useState<SlideOutline | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setLocalOutline({ ...editedOutlines[index] });
  };

  const handleSave = (index: number) => {
    if (localOutline) {
      const updated = [...editedOutlines];
      updated[index] = localOutline;
      setEditedOutlines(updated);
      onOutlinesUpdate?.(updated);
    }
    setEditingIndex(null);
    setLocalOutline(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setLocalOutline(null);
  };

  const handleDelete = (index: number) => {
    const updated = editedOutlines.filter((_, i) => i !== index);
    setEditedOutlines(updated);
    onOutlinesUpdate?.(updated);
  };

  const handleAddBullet = () => {
    if (localOutline) {
      setLocalOutline({
        ...localOutline,
        bullets: [...(localOutline.bullets || []), ""]
      });
    }
  };

  const handleBulletChange = (bulletIndex: number, value: string) => {
    if (localOutline) {
      const updated = [...(localOutline.bullets || [])];
      updated[bulletIndex] = value;
      setLocalOutline({
        ...localOutline,
        bullets: updated
      });
    }
  };

  const handleRemoveBullet = (bulletIndex: number) => {
    if (localOutline) {
      const updated = (localOutline.bullets || []).filter((_, i) => i !== bulletIndex);
      setLocalOutline({
        ...localOutline,
        bullets: updated
      });
    }
  };
  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'cover':
      case 'hero':
        return <FileText className="h-4 w-4" />;
      case 'list':
      case 'bullets':
        return <List className="h-4 w-4" />;
      case 'chart':
      case 'data-viz':
        return <BarChart3 className="h-4 w-4" />;
      case 'split':
      case 'comparison':
      case 'before-after':
        return <ImageIcon className="h-4 w-4" />;
      case 'process':
      case 'timeline':
      case 'roadmap':
        return <ArrowRight className="h-4 w-4" />;
      case 'stats':
        return <TrendingUp className="h-4 w-4" />;
      case 'feature-grid':
        return <Target className="h-4 w-4" />;
      case 'testimonial':
      case 'quote':
        return <Brain className="h-4 w-4" />;
      case 'mockup':
        return <Camera className="h-4 w-4" />;
      case 'closing':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'pie':
        return <PieChart className="h-3 w-3" />;
      case 'line':
        return <LineChart className="h-3 w-3" />;
      case 'area':
        return <Activity className="h-3 w-3" />;
      default:
        return <BarChart3 className="h-3 w-3" />;
    }
  };

  const getSlideTypeLabel = (type: string) => {
    switch (type) {
      case 'cover':
      case 'hero':
        return '🚀 Hero Slide';
      case 'list':
      case 'bullets':
        return '📝 Key Points';
      case 'chart':
      case 'data-viz':
        return '📊 Data Visual';
      case 'split':
      case 'comparison':
        return '⚖️ Comparison';
      case 'before-after':
        return '🔄 Before/After';
      case 'process':
        return '⚡ Process Flow';
      case 'timeline':
      case 'roadmap':
        return '📅 Timeline';
      case 'text':
        return '📄 Content Focus';
      case 'stats':
        return '📈 Statistics';
      case 'feature-grid':
        return '✨ Features';
      case 'testimonial':
        return '💬 Testimonial';
      case 'quote':
        return '💭 Quote';
      case 'mockup':
        return '📱 Product Mockup';
      case 'logo-cloud':
        return '🏢 Partners';
      case 'closing':
        return '🎯 Call to Action';
      default:
        return '✨ Premium';
    }
  };

  const getSlideTypeColor = (type: string) => {
    switch (type) {
      case 'cover':
      case 'hero':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300';
      case 'list':
      case 'bullets':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300';
      case 'chart':
      case 'data-viz':
      case 'stats':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300';
      case 'split':
      case 'comparison':
      case 'before-after':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300';
      case 'process':
      case 'timeline':
      case 'roadmap':
        return 'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300';
      case 'feature-grid':
        return 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300';
      case 'testimonial':
      case 'quote':
        return 'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300';
      case 'mockup':
        return 'bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 border-cyan-300';
      case 'closing':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getAIInsights = () => {
    const chartSlides = outlines.filter(o => o.type === 'chart' || o.type === 'data-viz' || o.chartData).length;
    const statsSlides = outlines.filter(o => o.type === 'stats' || (o.stats?.length ?? 0) > 0).length;
    const comparisonSlides = outlines.filter(o => o.type === 'comparison' || o.type === 'before-after').length;
    const timelineSlides = outlines.filter(o => o.type === 'timeline' || o.type === 'roadmap' || (o.timeline?.length ?? 0) > 0).length;
    const featureSlides = outlines.filter(o => o.type === 'feature-grid' || (o.icons?.length ?? 0) > 0).length;
    const testimonialSlides = outlines.filter(o => o.type === 'testimonial' || o.type === 'quote').length;
    const mockupSlides = outlines.filter(o => o.type === 'mockup').length;
    const listSlides = outlines.filter(o => o.type === 'list' || o.type === 'bullets').length;
    const splitSlides = outlines.filter(o => o.type === 'split').length;
    const imageSlides = outlines.filter(o => o.imageUrl || o.imageQuery).length;
    
    const insights = [];
    
    if (statsSlides > 0) {
      insights.push(`📈 ${statsSlides} impressive stats slide${statsSlides > 1 ? 's' : ''} with key metrics`);
    }
    if (chartSlides > 0) {
      insights.push(`📊 ${chartSlides} data visualization${chartSlides > 1 ? 's' : ''} for impact`);
    }
    if (comparisonSlides > 0) {
      insights.push(`⚖️ ${comparisonSlides} comparison${comparisonSlides > 1 ? 's' : ''} for persuasion`);
    }
    if (timelineSlides > 0) {
      insights.push(`📅 ${timelineSlides} timeline${timelineSlides > 1 ? 's' : ''} for storytelling`);
    }
    if (featureSlides > 0) {
      insights.push(`✨ ${featureSlides} feature grid${featureSlides > 1 ? 's' : ''} with icons`);
    }
    if (testimonialSlides > 0) {
      insights.push(`💬 ${testimonialSlides} testimonial${testimonialSlides > 1 ? 's' : ''} for social proof`);
    }
    if (mockupSlides > 0) {
      insights.push(`📱 ${mockupSlides} product mockup${mockupSlides > 1 ? 's' : ''}`);
    }
    if (listSlides > 0) {
      insights.push(`📝 ${listSlides} structured content slide${listSlides > 1 ? 's' : ''}`);
    }
    if (imageSlides > 0) {
      insights.push(`🖼️ ${imageSlides} AI-generated image${imageSlides > 1 ? 's' : ''}`);
    }
    
    // If no specific insights, add a general one
    if (insights.length === 0) {
      insights.push('Premium slide variety for engagement');
    }
    
    return insights;
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Summary */}
      <Card className="glass-effect border-yellow-400/20 p-6 relative overflow-hidden">
        <div className="absolute inset-0 shimmer opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold bolt-gradient-text">AI Analysis Results</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 glass-effect rounded-xl hover:scale-105 transition-transform">
              <div className="bolt-gradient-text text-3xl font-bold">{outlines.length}</div>
              <div className="text-sm text-muted-foreground">Professional Slides</div>
            </div>
            <div className="text-center p-4 glass-effect rounded-xl hover:scale-105 transition-transform">
              <div className="bolt-gradient-text text-3xl font-bold">
                {new Set(outlines.map(o => o.type)).size}
              </div>
              <div className="text-sm text-muted-foreground">Layout Types</div>
            </div>
            <div className="text-center p-4 glass-effect rounded-xl hover:scale-105 transition-transform">
              <div className="bolt-gradient-text text-3xl font-bold">
                {outlines.filter(o => o.imageUrl || o.imageQuery).length}
              </div>
              <div className="text-sm text-muted-foreground">Pro Images</div>
            </div>
            <div className="text-center p-4 glass-effect rounded-xl hover:scale-105 transition-transform">
              <div className="bolt-gradient-text text-3xl font-bold">
                {outlines.filter(o => o.chartData).length}
              </div>
              <div className="text-sm text-muted-foreground">Data Charts</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">AI Quality Insights:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getAIInsights().map((insight, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 hover:scale-105 transition-transform">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {insight}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Slide Outline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {editedOutlines.map((outline, index) => (
          <Card 
            key={index} 
            className="glass-effect border-yellow-400/20 hover:shadow-xl transition-all duration-300 group relative overflow-hidden hover:scale-105"
          >
            {/* Slide number indicator */}
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bolt-gradient flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {index + 1}
            </div>

            {/* AI badge */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                <Brain className="h-3 w-3 mr-1" />
                AI
              </Badge>
            </div>

            <CardContent className="p-6 pt-12">
              {editingIndex === index && localOutline ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slide Title</label>
                    <Input
                      value={localOutline.title}
                      onChange={(e) => setLocalOutline({ ...localOutline, title: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={localOutline.description}
                      onChange={(e) => setLocalOutline({ ...localOutline, description: e.target.value })}
                      className="w-full min-h-[80px]"
                    />
                  </div>

                  {localOutline.bullets && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Bullet Points</label>
                        <Button size="sm" variant="outline" onClick={handleAddBullet}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      {localOutline.bullets.map((bullet, bIndex) => (
                        <div key={bIndex} className="flex gap-2">
                          <Input
                            value={bullet}
                            onChange={(e) => handleBulletChange(bIndex, e.target.value)}
                            className="flex-1"
                            placeholder={`Point ${bIndex + 1}`}
                          />
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleRemoveBullet(bIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSave(index)}
                      className="flex-1 bolt-gradient text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  {/* Edit/Delete buttons */}
                  {editable && (
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(index)}
                        className="h-8"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(index)}
                        className="h-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Slide type badge */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSlideTypeColor(outline.type)} flex items-center gap-1 font-medium`}
                    >
                      {getSlideIcon(outline.type)}
                      {getSlideTypeLabel(outline.type)}
                    </Badge>
                  </div>

                  {/* Slide title */}
                  <h3 className="font-bold text-lg group-hover:bolt-gradient-text transition-all leading-tight">
                    {outline.title}
                  </h3>

                  {/* Slide description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {outline.description}
                  </p>

                {/* Content preview */}
                {outline.content && (
                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <span className="font-medium">Content Preview: </span>
                    {outline.content.substring(0, 100)}...
                  </div>
                )}

                {/* Features */}
                <div className="space-y-2">
                  {/* Bullets preview */}
                  {outline.bullets && outline.bullets.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <List className="h-3 w-3 text-green-500" />
                      <span className="font-medium">{outline.bullets.length} key points</span>
                    </div>
                  )}

                  {/* Chart preview */}
                  {outline.chartData && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getChartIcon(outline.chartData.type)}
                      <span className="font-medium">
                        {outline.chartData.type} chart ({outline.chartData.data?.length || 0} data points)
                      </span>
                    </div>
                  )}

                  {/* Image preview */}
                  {(outline.imageUrl || outline.imageQuery) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Camera className="h-3 w-3 text-blue-500" />
                      <span className="font-medium">Professional image included</span>
                    </div>
                  )}
                </div>

                {/* Visual preview mockup */}
                <div className="mt-4 h-24 rounded-lg bg-gradient-to-br from-muted/50 to-muted/80 border border-border/50 flex items-center justify-center group-hover:from-yellow-50 group-hover:to-blue-50 transition-all relative overflow-hidden">
                  {/* Show actual image preview if available */}
                  {outline.imageUrl && (
                    <Image
                      src={outline.imageUrl}
                      alt={outline.title || 'Slide image'}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity rounded-lg"
                      fill={true}
                      sizes="100vw"
                    />
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors relative z-10">
                    {getSlideIcon(outline.type)}
                    <span className="text-sm font-medium">Canva-Style Design</span>
                    <Sparkles className="h-4 w-4 group-hover:text-yellow-500 transition-colors animate-pulse" />
                  </div>
                </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flow Visualization */}
      <Card className="glass-effect border-yellow-400/20 p-6 relative overflow-hidden">
        <div className="absolute inset-0 shimmer opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">AI-Optimized Presentation Flow</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {outlines.map((outline, index) => (
              <div key={index} className="flex items-center">
                <div className="glass-effect px-4 py-3 rounded-xl text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2 border border-yellow-400/20">
                  {getSlideIcon(outline.type)}
                  <span className="max-w-[140px] truncate">{outline.title}</span>
                  {outline.chartData && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 ml-1">
                      Chart
                    </Badge>
                  )}
                  {(outline.imageUrl || outline.imageQuery) && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-1">
                      Image
                    </Badge>
                  )}
                </div>
                {index < outlines.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
          
          <div className="glass-effect p-4 rounded-xl bg-green-50/50 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Professional Quality Guaranteed</p>
                <p className="text-sm text-green-700">
                  AI has optimized your presentation with Canva-style design, high-quality Pexels images, 
                  meaningful data visualizations, and logical content flow for maximum audience engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}