/** @format */

/**
 * External dependencies
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { get, includes, noop, partition } from 'lodash';
import classNames from 'classnames';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */

import TrackComponentView from 'lib/analytics/track-component-view';
import { PLAN_BUSINESS, FEATURE_UPLOAD_PLUGINS, FEATURE_UPLOAD_THEMES } from 'lib/plans/constants';
import { recordTracksEvent } from 'state/analytics/actions';
import { getEligibility, isEligibleForAutomatedTransfer } from 'state/automated-transfer/selectors';
import { isJetpackSite } from 'state/sites/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'state/ui/selectors';
import Banner from 'components/banner';
import Button from 'components/button';
import Card from 'components/card';
import QueryEligibility from 'components/data/query-atat-eligibility';
import HoldList from './hold-list';
import PageViewTracker from 'lib/analytics/page-view-tracker';
import WarningList from './warning-list';
import config from 'config';
import { abtest } from 'lib/abtest';

export const EligibilityWarnings = ( {
	backUrl,
	context,
	eligibilityData,
	hasBusinessPlan,
	isEligible,
	isJetpack,
	isPlaceholder,
	onProceed,
	onCancel,
	siteId,
	siteSlug,
	translate,
} ) => {
	const warnings = get( eligibilityData, 'eligibilityWarnings', [] );

	const [ bannerHolds, listHolds ] = partition(
		get( eligibilityData, 'eligibilityHolds', [] ),
		hold => includes( [ 'NO_BUSINESS_PLAN', 'NOT_USING_CUSTOM_DOMAIN' ], hold )
	);

	const classes = classNames( 'eligibility-warnings', {
		'eligibility-warnings__placeholder': isPlaceholder,
	} );

	let businessUpsellBanner = null;
	if ( ! hasBusinessPlan && ! isJetpack ) {
		const description = translate(
			'Also get unlimited themes, advanced customization, no ads, live chat support, and more.'
		);
		const title = translate( 'Business plan required' );
		const plan = PLAN_BUSINESS;
		const useUpsellPage =
			config.isEnabled( 'upsell/nudge-a-palooza' ) &&
			abtest( 'nudgeAPalooza' ) === 'customPluginAndThemeLandingPages';
		let feature = null;
		let href = null;
		let event = null;

		if ( 'plugins' === context ) {
			feature = FEATURE_UPLOAD_PLUGINS;
			if ( useUpsellPage ) {
				href = '/feature/plugins/' + siteSlug;
				event = 'calypso-plugin-eligibility-upgrade-nudge-upsell';
			} else {
				event = 'calypso-plugin-eligibility-upgrade-nudge';
			}
		} else {
			feature = FEATURE_UPLOAD_THEMES;
			if ( useUpsellPage ) {
				href = '/feature/themes/' + siteSlug;
				event = 'calypso-theme-eligibility-upgrade-nudge-upsell';
			} else {
				event = 'calypso-theme-eligibility-upgrade-nudge';
			}
		}
		businessUpsellBanner = (
			<Banner
				href={ href }
				description={ description }
				feature={ feature }
				event={ event }
				plan={ plan }
				title={ title }
			/>
		);
	}

	return (
		<div className={ classes }>
			<PageViewTracker path="plugins/:plugin/eligibility/:site" title="Plugins > Eligibility" />
			<QueryEligibility siteId={ siteId } />
			<TrackComponentView
				eventName="calypso_automated_transfer_eligibility_show_warnings"
				eventProperties={ { context } }
			/>
			{ businessUpsellBanner }
			{ hasBusinessPlan &&
				! isJetpack &&
				includes( bannerHolds, 'NOT_USING_CUSTOM_DOMAIN' ) && (
					<Banner
						className="eligibility-warnings__banner"
						description={
							'plugins' === context
								? translate( 'To install this plugin, add a free custom domain.' )
								: translate( 'To upload themes, add a free custom domain.' )
						}
						href={ `/domains/manage/${ siteSlug }` }
						icon="domains"
						title={ translate( 'Custom domain required' ) }
					/>
				) }

			{ ( isPlaceholder || listHolds.length > 0 ) && (
				<HoldList holds={ listHolds } isPlaceholder={ isPlaceholder } siteSlug={ siteSlug } />
			) }
			{ warnings.length > 0 && <WarningList warnings={ warnings } /> }

			{ isEligible &&
				0 === listHolds.length &&
				0 === warnings.length && (
					<Card className="eligibility-warnings__no-conflicts">
						<Gridicon icon="thumbs-up" size={ 24 } />
						<span>
							{ translate( 'This site is eligible to install plugins and upload themes.' ) }
						</span>
					</Card>
				) }

			<Card className="eligibility-warnings__confirm-box">
				<div className="eligibility-warnings__confirm-text">
					{ ! isEligible && translate( 'The errors above must be resolved before proceeding. ' ) }
					{ isEligible &&
						warnings.length > 0 &&
						translate( 'If you proceed you will no longer be able to use these features. ' ) }
					{ translate( 'Have questions? Please {{a}}contact support{{/a}}.', {
						components: {
							a: (
								<a
									href="https://wordpress.com/help/contact"
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						},
					} ) }
				</div>
				<div className="eligibility-warnings__confirm-buttons">
					<Button href={ backUrl } onClick={ onCancel }>
						{ translate( 'Cancel' ) }
					</Button>

					<Button primary={ true } disabled={ ! isEligible } onClick={ onProceed }>
						{ translate( 'Proceed' ) }
					</Button>
				</div>
			</Card>
		</div>
	);
};

EligibilityWarnings.propTypes = {
	onProceed: PropTypes.func,
	backUrl: PropTypes.string,
	translate: PropTypes.func,
};

EligibilityWarnings.defaultProps = {
	onProceed: noop,
};

const mapStateToProps = state => {
	const siteId = getSelectedSiteId( state );
	const siteSlug = getSelectedSiteSlug( state );
	const eligibilityData = getEligibility( state, siteId );
	const isEligible = isEligibleForAutomatedTransfer( state, siteId );
	const eligibilityHolds = get( eligibilityData, 'eligibilityHolds', [] );
	const hasBusinessPlan = ! includes( eligibilityHolds, 'NO_BUSINESS_PLAN' );
	const isJetpack = isJetpackSite( state, siteId );
	const dataLoaded = !! eligibilityData.lastUpdate;

	return {
		eligibilityData,
		hasBusinessPlan,
		isEligible,
		isJetpack,
		isPlaceholder: ! dataLoaded,
		siteId,
		siteSlug,
	};
};

const mapDispatchToProps = {
	trackCancel: ( eventProperties = {} ) =>
		recordTracksEvent( 'calypso_automated_transfer_eligibility_click_cancel', eventProperties ),
	trackProceed: ( eventProperties = {} ) =>
		recordTracksEvent( 'calypso_automated_transfer_eligibilty_click_proceed', eventProperties ),
};

const mergeProps = ( stateProps, dispatchProps, ownProps ) => {
	const context = includes( ownProps.backUrl, 'plugins' ) ? 'plugins' : 'themes';
	const onCancel = () => dispatchProps.trackCancel( { context } );
	const onProceed = () => {
		ownProps.onProceed();
		dispatchProps.trackProceed( { context } );
	};
	return Object.assign( {}, ownProps, stateProps, dispatchProps, { onCancel, onProceed, context } );
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	mergeProps
)( localize( EligibilityWarnings ) );
