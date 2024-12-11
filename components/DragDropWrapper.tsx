"use client";

import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import type { SearchToken } from "@/types/token";

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(selectedTokens);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  if (!isClient) {
    return null; // Return null on server-side
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable
        droppableId="tokens"
        direction="horizontal"
        isDropDisabled={false}
        isCombineEnabled={false}
        ignoreContainerClipping={false}
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
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center cursor-move"
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
                      onClick={() => onTokenSelect(token)}
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
      </Droppable>
    </DragDropContext>
  );
}
