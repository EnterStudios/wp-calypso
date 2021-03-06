/** @format */

/**
 * External dependencies
 */

import { some } from 'lodash';

/**
 * Internal dependencies
 */
import { getSiteUserConnections } from 'state/sharing/publicize/selectors';

/**
 * Returns true if a broken Publicize connections exists for the specified site
 * and user, or false otherwise.
 *
 * @param  {Object}  state  Global state tree
 * @param  {Number}  siteId Site ID
 * @param  {Number}  userId User ID
 * @return {Boolean}        Whether broken connection exists
 */
export default function hasBrokenSiteUserConnection( state, siteId, userId ) {
	return some( getSiteUserConnections( state, siteId, userId ), { status: 'broken' } );
}
