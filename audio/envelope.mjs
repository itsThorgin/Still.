export class GainEnvelope {
  constructor(parameter, time, value = 0) {
    this.parameter = parameter;
    this.points = [{ time, value, ramp: false }];
    parameter.setValueAtTime(value, time);
  }

  valueAt(time) {
    let previous = this.points[0];
    for (let i = 1; i < this.points.length; i++) {
      const next = this.points[i];
      if (time < next.time) {
        if (!next.ramp || next.time === previous.time) return previous.value;
        const position = Math.max(0, (time - previous.time) / (next.time - previous.time));
        return previous.value + (next.value - previous.value) * position;
      }
      previous = next;
    }
    return previous.value;
  }

  hold(time) {
    
    const value = this.valueAt(time);
    this.parameter.cancelScheduledValues(time);
    this.parameter.setValueAtTime(value, time);
    this.points = [{ time, value, ramp: false }];
    return value;
  }

  set(value, time) {
    this.parameter.setValueAtTime(value, time);
    this.points.push({ time, value, ramp: false });
  }

  ramp(value, time) {
    this.parameter.linearRampToValueAtTime(value, time);
    this.points.push({ time, value, ramp: true });
  }
}
