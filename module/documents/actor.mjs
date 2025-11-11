/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class PolarisActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data that isn't
   * handled by the actor's DataModel. Data calculated in this step should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const flags = actorData.flags.Polaris || {};

    // Most derived data is now handled in the DataModel classes
    // (see module/data/actor-character.mjs and module/data/actor-npc.mjs)
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // If the actor has a DataModel, use its getRollData method
    if (this.system.getRollData) {
      return this.system.getRollData();
    }

    // Fallback: return a shallow copy of the system data
    return { ...this.system };
  }
}
