"use client";

import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import type { SearchToken } from "@/types/token";

interface DroppableProps {
  children: any;
  droppableId: string;
  direction?: "horizontal" | "vertical";
  isDropDisabled?: boolean;
  isCombineEnabled?: boolean;
  ignoreContainerClipping?: boolean;
}

// Strict mode wrapper for react-beautiful-dnd
function StrictModeDroppable({
  children,
  droppableId,
  direction = "horizontal",
  isDropDisabled = false,
  isCombineEnabled = false,
  ignoreContainerClipping = false,
}: DroppableProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Droppable
      droppableId={droppableId}
      direction={direction}
      isDropDisabled={isDropDisabled}
      isCombineEnabled={isCombineEnabled}
      ignoreContainerClipping={ignoreContainerClipping}
    >
      {children}
    </Droppable>
  );
}

interface DragDropWrapperProps {
  selectedTokens: SearchToken[];
  onTokenSelect: (token: SearchToken) => void;
  onReorder: (tokens: SearchToken[]) => void;
}

export default function DragDropWrapper({
  selectedTokens,
  onTokenSelect,
  onReorder,
}: DragDropWrapperProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedTokens);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <StrictModeDroppable
        droppableId="tokens"
        direction="horizontal"
        isDropDisabled={false}
        isCombineEnabled={false}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-wrap gap-2"
          >
            {selectedTokens.map((token, index) => (
              <Draggable
                key={token.id}
                draggableId={token.id.toString()}
                index={index}
                isDragDisabled={false}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center cursor-move ${
                      snapshot.isDragging ? "shadow-lg" : ""
                    }`}
                  >
                    <img
                      src={token.logo}
                      alt={`${token.name} logo`}
                      className="w-4 h-4 mr-2 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
                      }}
                    />
                    {token.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTokenSelect(token);
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
}
