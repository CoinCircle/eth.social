function createVariables() {
  const variables = {
    screenXS: 480,
    screenMS: 480,
    screenSM: 768,
    screenMD: 992,
    screenLG: 1200,
    gridColumns: 12,
    gridGutterWidth: 30
  }

  variables.screenXSMin = variables.screenXS;
  variables.screenMSMin = variables.screenMS;
  variables.screenSMMin = variables.screenSM;
  variables.screenMDMin = variables.screenMD;
  variables.screenLGMin = variables.screenLG;

  variables.screenXSMax = variables.screenMSMin - 1;
  variables.screenMSMax = variables.screenSMMin - 1;
  variables.screenSMMax = variables.screenMDMin - 1;
  variables.screenMDMax = variables.screenLGMin - 1;

  variables.containerMS = 480 + variables.gridGutterWidth;
  variables.containerSM = 720 + variables.gridGutterWidth;
  variables.containerMD = 940 + variables.gridGutterWidth;
  variables.containerLG = 1140 + variables.gridGutterWidth;

  return variables;
};
export const variables = createVariables();

const mediaQueryXS = `@media (max-width: ${variables.screenXSMax}px)`;
const mediaQueryMS = `@media (min-width: ${variables.screenMSMin}px) and (max-width: ${variables.screenMSMax}px)`;
const mediaQuerySM = `@media (min-width: ${variables.screenSMMin}px) and (max-width: ${variables.screenSMMax}px)`;
const mediaQueryMD = `@media (min-width: ${variables.screenMDMin}px) and (max-width: ${variables.screenMDMax}px)`;
const mediaQueryLG = `@media (min-width: ${variables.screenLGMin}px)`;


export const container = {
  marginRight: 'auto',
  marginLeft: 'auto',
  paddingLeft: Math.floor(variables.gridGutterWidth / 2),
  paddingRight: Math.ceil(variables.gridGutterWidth / 2),
  [mediaQuerySM]: {
    width: variables.containerSM
  },
  [mediaQueryMD]: {
    width: variables.containerMD
  },
  [mediaQueryLG]: {
    width: variables.containerLG
  }
};

export const row = {
  marginLeft: Math.ceil(variables.gridGutterWidth / -2),
  marginRight: Math.floor(variables.gridGutterWidth / -2)
};

export const column = {
  position: 'relative',
  minHeight: '1px',
  paddingLeft: Math.ceil(variables.gridGutterWidth / 2),
  paddingRight: Math.floor(variables.gridGutterWidth / 2),
  float: 'left',
  [mediaQueryMS]: {
    float: 'left'
  },
  [mediaQuerySM]: {
    float: 'left'
  },
  [mediaQueryMD]: {
    float: 'left'
  },
  [mediaQueryLG]: {
    float: 'left'
  }
};

function createColumnWidth() {
  const xs = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    width: `${(i / variables.gridColumns * 100).toFixed(5)}%`
  }))
  const ms = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMS]: {
      width: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const sm = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQuerySM]: {
      width: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const md = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMD]: {
      width: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const lg = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryLG]: {
      width: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))

  return {xs, ms, sm, md, lg};
}
export const columnWidth = createColumnWidth()

function createColumnOffset() {
  const xs = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    marginLeft: `${(i / variables.gridColumns * 100).toFixed(5)}%`
  }))
  const ms = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMS]: {
      marginLeft: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const sm = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQuerySM]: {
      marginLeft: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const md = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMD]: {
      marginLeft: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const lg = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryLG]: {
      marginLeft: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))

  return {xs, ms, sm, md, lg};
}
export const columnOffset = createColumnOffset()

function createColumnPull() {
  const xs = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    right: `${(i / variables.gridColumns * 100).toFixed(5)}%`
  }))
  const ms = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMS]: {
      right: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const sm = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQuerySM]: {
      right: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const md = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMD]: {
      right: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const lg = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryLG]: {
      right: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))

  return {xs, ms, sm, md, lg};
}
export const columnPull = createColumnPull()

function createColumnPush() {
  const xs = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    left: `${(i / variables.gridColumns * 100).toFixed(5)}%`
  }))
  const ms = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMS]: {
      left: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const sm = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQuerySM]: {
      left: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const md = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryMD]: {
      left: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))
  const lg = Array(variables.gridColumns + 1).fill(null).map((v, i) => ({
    [mediaQueryLG]: {
      left: `${(i / variables.gridColumns * 100).toFixed(5)}%`
    }
  }))

  return {xs, ms, sm, md, lg};
}
export const columnPush = createColumnPush()

export const columnHidden = {
  xs: {
    [mediaQueryXS]: {
      display: 'none'
    }
  },
  ms: {
    [mediaQueryMS]: {
      display: 'none'
    }
  },
  sm: {
    [mediaQuerySM]: {
      display: 'none'
    }
  },
  md: {
    [mediaQueryMD]: {
      display: 'none'
    }
  },
  lg: {
    [mediaQueryLG]: {
      display: 'none'
    }
  }
}

export const clearfix = {
  clear: 'both'
}
