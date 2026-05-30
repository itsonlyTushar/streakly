"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { DSAItem } from "@/services/dsa.service";
import { DSAPriority } from "@/lib/schemas/dsa.schema";
import { useUpdateDSAItem } from "@/hooks/use-dsa";
import { format } from "date-fns";

const PRIORITIES: DSAPriority[] = ["High", "Medium", "Low", "Unprioritized"];

interface DSAKanbanBoardProps {
  items: DSAItem[];
}

export function DSAKanbanBoard({ items }: DSAKanbanBoardProps) {
  const updateMutation = useUpdateDSAItem();
  
  // We need to group items by priority
  const [columns, setColumns] = useState<Record<DSAPriority, DSAItem[]>>({
    High: [],
    Medium: [],
    Low: [],
    Unprioritized: [],
  });

  // Hydrate columns when items change
  useEffect(() => {
    const newCols: Record<DSAPriority, DSAItem[]> = {
      High: [],
      Medium: [],
      Low: [],
      Unprioritized: [],
    };
    
    items.forEach(item => {
      const priority = item.priority || "Unprioritized";
      if (newCols[priority]) {
        newCols[priority].push(item);
      } else {
        newCols["Unprioritized"].push(item);
      }
    });

    setColumns(newCols);
  }, [items]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceCol = source.droppableId as DSAPriority;
    const destCol = destination.droppableId as DSAPriority;
    
    // Optimistic UI update
    const sourceItems = [...columns[sourceCol]];
    const destItems = sourceCol === destCol ? sourceItems : [...columns[destCol]];
    
    const [movedItem] = sourceItems.splice(source.index, 1);
    // Clone to avoid mutating original state item directly in strict mode before React handles it
    const clonedMovedItem = { ...movedItem, priority: destCol }; 
    destItems.splice(destination.index, 0, clonedMovedItem);
    
    setColumns(prev => ({
      ...prev,
      [sourceCol]: sourceItems,
      [destCol]: destItems,
    }));

    // Perform the mutation
    if (sourceCol !== destCol) {
      updateMutation.mutate({
        itemId: draggableId,
        data: { priority: destCol }
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 min-h-[60vh] snap-x">
        {PRIORITIES.map((priority) => (
          <div key={priority} className="flex-shrink-0 w-[300px] flex flex-col bg-secondary/10 border border-border/50 rounded-2xl p-4 snap-center">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground flex items-center gap-2">
                {priority === "High" && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                {priority === "Medium" && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                {priority === "Low" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                {priority === "Unprioritized" && <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />}
                {priority}
              </h3>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md border border-border/40">
                {columns[priority].length}
              </span>
            </div>
            
            <Droppable droppableId={priority}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 transition-all rounded-xl min-h-[150px] p-1 ${snapshot.isDraggingOver ? "bg-secondary/40 ring-1 ring-primary/20" : ""}`}
                >
                  <div className="flex flex-col gap-3">
                    {columns[priority].map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                            className={`bg-card border border-border/60 rounded-xl p-4 transition-all ${
                              snapshot.isDragging ? "shadow-2xl shadow-primary/10 border-primary scale-[1.02] rotate-1 z-50 ring-1 ring-primary/50" : "shadow-sm hover:border-primary/50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  item.difficulty === "Easy"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : item.difficulty === "Medium"
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                }`}
                              >
                                {item.difficulty}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm mb-3 leading-tight">{item.problemName}</h4>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.topics.slice(0, 3).map((t) => (
                                <span key={t} className="px-1.5 py-0.5 bg-secondary/80 text-muted-foreground rounded text-[8px] font-black uppercase border border-border/40">
                                  {t}
                                </span>
                              ))}
                              {item.topics.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-secondary/80 text-muted-foreground rounded text-[8px] font-black uppercase border border-border/40">
                                  +{item.topics.length - 3}
                                </span>
                              )}
                            </div>
                            {item.nextReviewDate && (
                              <div className="text-[10px] text-muted-foreground font-medium pt-2 border-t border-border/40">
                                Rev: <span className="text-foreground">{format(item.nextReviewDate.toDate(), "MMM d")}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
