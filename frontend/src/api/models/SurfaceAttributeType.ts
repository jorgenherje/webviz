/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A surface has a single array with values, e.g. depth, time, property, seismic, thickness.
 * Only surfaces with depth and time have z-values that can be plotted in 3D.
 * The other attributes are scalar values that can be plotted in 2D or used as colormapping for 3D surfaces.
 *
 * Ideally if the attribute is a scalar, there should be corresponding z-values, but this information is not
 * available in the metadata.
 *
 * To be revisited later when the metadata is more mature.
 */
export enum SurfaceAttributeType {
    DEPTH = 'depth',
    FACIES_THICKNESS = 'facies_thickness',
    FLUID_CONTACT = 'fluid_contact',
    PINCHOUT = 'pinchout',
    PROPERTY = 'property',
    SEISMIC = 'seismic',
    SUBCROP = 'subcrop',
    THICKNESS = 'thickness',
    TIME = 'time',
    VELOCITY = 'velocity',
    VOLUMES = 'volumes',
    UNKNOWN = 'UNKNOWN',
}
