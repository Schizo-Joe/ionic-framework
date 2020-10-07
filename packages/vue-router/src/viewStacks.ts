import { generateId } from './utils';
const pathToRegexp = require("path-to-regexp");
import {  RouteInfo,
  ViewItem,
  ViewStacks,
} from './types';
import { RouteLocationMatched } from 'vue-router';

export const createViewStacks = () => {
  let viewStacks: ViewStacks = {};
  const tabsPrefixes = new Set();

  const addTabsPrefix = (prefix: string) => tabsPrefixes.add(prefix);
  const hasTabsPrefix = (path: string) => {
    const values = Array.from(tabsPrefixes.values());
    const hasPrefix = values.find((v: string) => path.includes(v));
    return hasPrefix !== undefined;
  }

  const clear = (outletId: number) => {
    delete viewStacks[outletId];
  }

  const getViewStack = (outletId: number) => {
    return viewStacks[outletId];
  }

  const registerIonPage = (viewItem: ViewItem, ionPage: HTMLElement) => {
    viewItem.ionPageElement = ionPage;
  }

  const findViewItemByRouteInfo = (routeInfo: RouteInfo, outletId?: number) => {
    return findViewItemByPath(routeInfo.pathname, outletId);
  }

  const findLeavingViewItemByRouteInfo = (routeInfo: RouteInfo, outletId?: number) => {
    return findViewItemByPath(routeInfo.lastPathname, outletId);
  }

  const findViewItemInStack = (path: string, stack: ViewItem[]): ViewItem | undefined => {
    return stack.find((viewItem: ViewItem) => {
      if (viewItem.pathname === path) {
        return viewItem;
      }

      return undefined;
    })
  }

  const findViewItemByPath = (path: string, outletId?: number): ViewItem | undefined => {
    const matchView = (viewItem: ViewItem) => {
      const pathname = path;
      const viewItemPath = viewItem.matchedRoute.path;

      const regexp = pathToRegexp(viewItemPath, [], {
        end: false,
        strict: false,
        sensitive: false
      });
      return (regexp.exec(pathname)) ? viewItem : undefined;
    }

    if (outletId) {
      const stack = viewStacks[outletId];
      if (!stack) return undefined;

      const quickMatch = findViewItemInStack(path, stack);
      if (quickMatch) return quickMatch;

      const match = stack.find(matchView);
      if (match) return match;
    }

    for (let outletId in viewStacks) {
      const stack = viewStacks[outletId];
      const viewItem = findViewItemInStack(path, stack);
      if (viewItem) {
          return viewItem;
      }
    }
    return undefined;
  }

  const createViewItem = (outletId: number, vueComponent: any, matchedRoute: RouteLocationMatched, routeInfo: RouteInfo, ionPage?: HTMLElement): ViewItem => {
    return {
      id: generateId('viewItem'),
      pathname: routeInfo.pathname,
      outletId,
      matchedRoute,
      ionPageElement: ionPage,
      vueComponent,
      ionRoute: false,
      mount: false
    };
  }

  const add = (viewItem: ViewItem): void => {
    const { outletId } = viewItem;
    if (!viewStacks[outletId]) {
      viewStacks[outletId] = [viewItem];
    } else {
      viewStacks[outletId].push(viewItem);
    }
  }

  const remove = (viewItem: ViewItem, outletId?: number): void => {
    if (!outletId) { throw Error('outletId required') }

    const viewStack = viewStacks[outletId];
    if (viewStack) {
      viewStacks[outletId] = viewStack.filter(item => item.id !== viewItem.id);
    }
  }

  const getChildrenToRender = (outletId: number): ViewItem[] => {
    const viewStack = viewStacks[outletId];
    if (viewStack) {
      const components = viewStacks[outletId].filter(v => v.mount);
      return components;
    }
    return [];
  }

  return {
    clear,
    addTabsPrefix,
    hasTabsPrefix,
    findViewItemByRouteInfo,
    findLeavingViewItemByRouteInfo,
    createViewItem,
    getChildrenToRender,
    add,
    remove,
    registerIonPage,
    getViewStack
  }
}
