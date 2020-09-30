import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Logger } from './logger';

const SHOW_LOGGER_INFO = false;

const uniqid = () => Math.random().toString(36).substr(2);

const ctxRootName = '__root__';
const ctx = createContext(ctxRootName);
const CtxProvider = ctx.Provider;

export const BusStop: React.FC<{ name?: string }> = ({
  name = uniqid(),
  children,
}) => React.createElement(ctx.Provider, { value: name }, children);

const useEventName = (typeArg: string) => {
  const namePrefix = useContext(ctx);
  const name = useMemo(() => {
    return `@${namePrefix}/${typeArg}`;
  }, [namePrefix, typeArg]);
  return name;
};

export const useBusEffect = <StateType>(
  type: string,
  lisenter: (s: StateType) => void,
  deps?: any[]
) => {
  const evName = useEventName(type);
  useEffect(() => {
    const handler = ({ detail }: { detail: StateType }) => {
      SHOW_LOGGER_INFO && Logger.info('emit BusEffect', `[${evName}]`);
      lisenter(detail);
    };
    window.addEventListener(evName, handler as any);
    return () => window.removeEventListener(evName, handler as any);
  }, [evName, lisenter, ...(deps || [])]);
};

export const createUseBusEffect = (type: string): typeof useEffect => (
  effect,
  deps
) => useBusEffect(type, effect, deps as any[]);

const BusStateMap = new Map<string, any>();

export const useBusState = <StateType>(
  type: string,
  initialValue?: StateType
) => {
  const [state, updateState] = useState(() => {
    if (BusStateMap.has(type)) {
      return BusStateMap.get(type) as StateType;
    }
    BusStateMap.set(type, initialValue);
    return initialValue;
  });
  const evName = useEventName(type) as 'click';

  useEffect(() => {
    const handler = ({ detail }: { detail: StateType }) => {
      SHOW_LOGGER_INFO && Logger.info('dispatch BusState', `[${evName}]`);
      updateState(() => detail);
    };
    window.addEventListener(evName, handler as any);
    return () => window.removeEventListener(evName, handler as any);
  }, [updateState, evName]);

  return [
    state,
    (detail: StateType) => {
      window.dispatchEvent(
        new CustomEvent(evName, {
          detail,
        })
      );
    },
  ] as const;
};

export const createUseBusState = <StateType>(type: string) => (
  initialValue?: StateType
) => useBusState(type, initialValue);

export const useDispatch = <StateType>(type: string) => {
  const [, dispatch] = useBusState<StateType>(type);
  return dispatch;
};

export const useBusCallback = useDispatch;
