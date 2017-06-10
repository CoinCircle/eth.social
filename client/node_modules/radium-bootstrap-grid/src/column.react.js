import Component from 'react-pure-render/component';
import Radium from 'radium';
import React, {PropTypes as RPT} from 'react';
import { column, columnHidden, columnOffset, columnPull, columnPush, columnWidth } from './grid';

@Radium
export default class Column extends Component {

  static propTypes = {
    children: RPT.node,
    lg:       RPT.number,
    lgHidden: RPT.bool,
    lgOffset: RPT.number,
    lgPull:   RPT.number,
    lgPush:   RPT.number,
    md:       RPT.number,
    mdHidden: RPT.bool,
    mdOffset: RPT.number,
    mdPull:   RPT.number,
    mdPush:   RPT.number,
    ms:       RPT.number,
    msHidden: RPT.bool,
    msOffset: RPT.number,
    msPull:   RPT.number,
    msPush:   RPT.number,
    sm:       RPT.number,
    smHidden: RPT.bool,
    smOffset: RPT.number,
    smPull:   RPT.number,
    smPush:   RPT.number,
    style:    RPT.object,
    xs:       RPT.number,
    xsHidden: RPT.bool,
    xsOffset: RPT.number,
    xsPull:   RPT.number,
    xsPush:   RPT.number
  }

  columnOptions(size) {
    const hidden = this.props[`${size}Hidden`];
    const offset = this.props[`${size}Offset`];
    const pull = this.props[`${size}Pull`];
    const push = this.props[`${size}Push`];

    return [
      hidden && columnHidden[size],
      offset && columnOffset[size][offset],
      pull && columnPull[size][pull],
      push && columnPush[size][push]
    ]
  }

  render() {
    const {
      children,
      lg,
      md,
      ms,
      sm,
      style,
      xs,
      ...props
    } = this.props;

    return (
      <div
        style={[
          column,
          columnWidth['xs'][xs || 1],
          columnWidth['ms'][ms || xs || 1],
          columnWidth['sm'][sm || ms || xs || 1],
          columnWidth['md'][md || sm || ms || xs || 1],
          columnWidth['lg'][lg || md || sm || ms || xs || 1],
          this.columnOptions('xs'),
          this.columnOptions('ms'),
          this.columnOptions('sm'),
          this.columnOptions('md'),
          this.columnOptions('lg'),
          style
        ]}
        {...props}
      >
        {children}
      </div>
    );
  }
}
