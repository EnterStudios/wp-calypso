/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { isSiteWordadsUnsafe } from '../selectors';

describe( 'selectors', () => {
	const state = {
		wordads: {
			status: {
				items: {
					2916284: {
						unsafe: 'mature',
						active: true,
					},
					77203074: {},
				},
				fetchingItems: {
					2916284: true,
					77203074: false,
				},
			},
		},
	};
	describe( '#isSiteWordadsUnsafe()', () => {
		test( 'should return status value for a given site ID', () => {
			expect( isSiteWordadsUnsafe( state, 2916284 ) ).to.eql( 'mature' );
		} );
		test( 'should return false when sticker absent', () => {
			expect( isSiteWordadsUnsafe( state, 77203074 ) ).to.eql( false );
		} );
		test( 'should return false when site absent', () => {
			expect( isSiteWordadsUnsafe( state, 123 ) ).to.eql( false );
		} );
	} );
} );
