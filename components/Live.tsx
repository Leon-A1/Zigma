"use client";

import { useCallback, useEffect, useState } from "react";

import useInterval from "@/hooks/useInterval";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import { shortcuts } from "@/constants";

import { CursorChat } from "./index";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
};

const Live = ({ canvasRef, undo, redo }: Props) => {
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });

  const [reactions, setReactions] = useState<Reaction[]>([]);

  const setReaction = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  useInterval(() => {
    setReactions((reactions) =>
      reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000)
    );
  }, 1000);

  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursorState.reaction
    ) {
      setReactions((reactions) =>
        reactions.concat([
          {
            point: { x: cursorState.x || 0, y: cursorState.y || 0 },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );
    }
  }, 100);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
      } else if (e.key === "Escape") {
        setCursorState({ mode: CursorMode.Hidden });
      } else if (e.key === "e") {
        setCursorState({ mode: CursorMode.ReactionSelector });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
      }
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();

      if (cursorState.mode !== CursorMode.ReactionSelector) {
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        setCursorState((state) => ({
          ...state,
          x,
          y,
        }));
      }
    },
    [cursorState.mode]
  );

  const handlePointerLeave = useCallback(() => {
    setCursorState({
      mode: CursorMode.Hidden,
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      setCursorState((state) => ({
        ...state,
        x,
        y,
        isPressed: cursorState.mode === CursorMode.Reaction,
      }));
    },
    [cursorState.mode]
  );

  const handlePointerUp = useCallback(() => {
    setCursorState((state) => ({
      ...state,
      isPressed: false,
    }));
  }, []);

  const handleContextMenuClick = useCallback(
    (key: string) => {
      switch (key) {
        case "Chat":
          setCursorState({
            mode: CursorMode.Chat,
            previousMessage: null,
            message: "",
          });
          break;

        case "Reactions":
          setCursorState({ mode: CursorMode.ReactionSelector });
          break;

        case "Undo":
          undo();
          break;

        case "Redo":
          redo();
          break;

        default:
          break;
      }
    },
    [undo, redo]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className='relative flex h-full w-full flex-1 items-center justify-center'
        id='canvas'
        style={{
          cursor: cursorState.mode === CursorMode.Chat ? "none" : "auto",
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <canvas ref={canvasRef} />

        {reactions.map((reaction) => (
          <FlyingReaction
            key={reaction.timestamp.toString()}
            x={reaction.point.x}
            y={reaction.point.y}
            timestamp={reaction.timestamp}
            value={reaction.value}
          />
        ))}

        {cursorState.mode === CursorMode.Chat && (
          <CursorChat cursor={cursorState} setCursorState={setCursorState} />
        )}

        {cursorState.mode === CursorMode.ReactionSelector && (
          <ReactionSelector
            setReaction={(reaction) => {
              setReaction(reaction);
            }}
          />
        )}
      </ContextMenuTrigger>

      <ContextMenuContent className='right-menu-content'>
        {shortcuts.map((item) => (
          <ContextMenuItem
            key={item.key}
            className='right-menu-item'
            onClick={() => handleContextMenuClick(item.name)}
          >
            <p>{item.name}</p>
            <p className='text-xs text-primary-grey-300'>{item.shortcut}</p>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default Live;
