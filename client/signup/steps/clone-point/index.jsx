/** @format */
/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import StepWrapper from 'signup/step-wrapper';
import Card from 'components/card';
import Button from 'components/button';
import SignupActions from 'lib/signup/actions';
import ActivityLogItem from 'my-sites/stats/activity-log-item';

import QuerySites from 'components/data/query-sites';
import QueryActivityLog from 'components/data/query-activity-log';
import QueryRewindState from 'components/data/query-rewind-state';
import QuerySiteSettings from 'components/data/query-site-settings';

import { getSiteGmtOffset, getSiteTimezoneValue, getActivityLogs } from 'state/selectors';
import {
	adjustMoment,
	getActivityLogQuery,
	getStartMoment,
} from 'my-sites/stats/activity-log/utils';

class ClonePointStep extends Component {
	static propTypes = {
		flowName: PropTypes.string,
		goToNextStep: PropTypes.func.isRequired,
		positionInFlow: PropTypes.number,
		signupProgress: PropTypes.array,
		stepName: PropTypes.string,
		signupDependencies: PropTypes.object,
	};

	state = {
		showLog: false,
	};

	selectCurrent = () => {
		SignupActions.submitSignupStep( { stepName: this.props.stepName }, [], {
			clonePoint: 0,
		} );

		this.props.goToNextStep();
	};

	selectedPoint = activityTs => {
		SignupActions.submitSignupStep( { stepName: this.props.stepName }, [], {
			clonePoint: activityTs,
		} );

		this.props.goToNextStep();
	};

	selectPrevious = () => {
		this.setState( { showLog: true } );
	};

	applySiteOffset = moment => {
		const { timezone, gmtOffset } = this.props;
		return adjustMoment( { timezone, gmtOffset, moment } );
	};

	renderActivityLog = () => {
		const { siteId, logs, moment, translate } = this.props;

		const timePeriod = ( () => {
			const today = this.applySiteOffset( moment.utc( Date.now() ) );
			let last = null;

			return ( { rewindId } ) => {
				const ts = this.applySiteOffset( moment.utc( rewindId * 1000 ) );

				if ( null === last || ! ts.isSame( last, 'day' ) ) {
					last = ts;
					return (
						<h2 className="activity-log__time-period" key={ `time-period-${ ts }` }>
							{ ts.isSame( today, 'day' )
								? ts.format( translate( 'LL[ — Today]', { context: 'moment format string' } ) )
								: ts.format( 'LL' ) }
						</h2>
					);
				}

				return null;
			};
		} )();

		const theseLogs = logs;

		return (
			<div>
				<QuerySites siteId={ siteId } />
				<QueryActivityLog siteId={ siteId } />
				<QuerySiteSettings siteId={ siteId } />
				<section>
					{ theseLogs.map( log => (
						<Fragment key={ log.activityId }>
							{ timePeriod( log ) }
							<ActivityLogItem
								key={ log.activityId }
								activityId={ log.activityId }
								disableRestore={ true }
								disableBackup={ true }
								hideRestore={ true }
								enableClone={ true }
								cloneOnClick={ this.selectedPoint }
								siteId={ siteId }
							/>
						</Fragment>
					) ) }
				</section>
			</div>
		);
	};

	renderSelector = () => {
		const { translate } = this.props;

		return (
			<div>
				<div className="clone-point__column">
					<Card className="clone-point__image-card">
						<img
							alt="upgrade"
							className="clone-point__image"
							src="/calypso/images/upgrades/thank-you.svg"
						/>
					</Card>
					<Card className="clone-point__text-card">
						<Button className="clone-point__button" onClick={ this.selectCurrent }>
							{ translate( 'Clone current state' ) }
						</Button>
						<p className="clone-point__description">
							{ translate( 'Create a clone of your site as it is right now.' ) }
						</p>
					</Card>
				</div>
				<div className="clone-point__column">
					<Card className="clone-point__image-card">
						<img
							alt="upgrade"
							className="clone-point__image"
							src="/calypso/images/upgrades/thank-you.svg"
						/>
					</Card>
					<Card className="clone-point__text-card">
						<Button className="clone-point__button" onClick={ this.selectPrevious }>
							{ translate( 'Clone previous state' ) }
						</Button>
						<p className="clone-point__description">
							{ translate(
								'Browse your event history and choose an earlier state to clone from.'
							) }
						</p>
					</Card>
				</div>
			</div>
		);
	};

	renderStepContent = () => {
		return (
			<div className="clone-point__wrap">
				{ this.state.showLog ? this.renderActivityLog() : this.renderSelector() }
			</div>
		);
	};

	render() {
		const {
			flowName,
			stepName,
			positionInFlow,
			signupProgress,
			originSiteName,
			translate,
		} = this.props;

		const headerText = translate( "Let's clone %(origin)s", { args: { origin: originSiteName } } );

		return (
			<StepWrapper
				flowName={ flowName }
				stepName={ stepName }
				headerText={ headerText }
				fallbackHeaderText={ headerText }
				subHeaderText={ '' }
				fallbackSubHeaderText={ '' }
				positionInFlow={ positionInFlow }
				signupProgress={ signupProgress }
				stepContent={ this.renderStepContent() }
			/>
		);
	}
}

export default connect( ( state, { startDate } ) => {
	const siteId = 137043832;

	const gmtOffset = getSiteGmtOffset( state, siteId );
	const timezone = getSiteTimezoneValue( state, siteId );
	const logRequestQuery = getActivityLogQuery( state, siteId );

	return {
		siteId,
		logRequestQuery,
		logs: getActivityLogs(
			state,
			siteId,
			getActivityLogQuery( { gmtOffset, startDate, timezone } )
		),
	};
} )( localize( ClonePointStep ) );
