import angular from 'angular';

import angularAnimate from 'angular-animate';
import './libraries/angular-contenteditable.js';
import './libraries/ng-contextmenu.min.js';
import angularDragula from 'angular-dragula';

import { MainViewModel } from './view-models/main-view-model';
import { TournamentType } from './view-models/tournament-phase-settings-view-model';

import { registerMvvmPresenter } from './utility/mvvm-presenter';
import { registerEventUtilities } from './utility/util-events';
import { registerProxyClick } from './utility/util-proxy-click';
import { registerExpander } from './utility/util-expander';
import { registerInfoButton } from './utility/util-info-button';
import { registerAutoFocus } from './utility/util-auto-focus';
import { registerFocus } from './utility/util-focus';
import { registerInlineFile } from './utility/util-inline-file';
import { registerModelTypeInt } from './utility/util-model-type-int';
import { registerContextMenuData } from './utility/util-context-menu-data';
import { registerDragDrop } from './utility/util-drag-drop';
import { registerSelectOnFocus } from './utility/util-select-on-focus';
import { registerSelectText } from './utility/util-select-text';
import { registerWatch } from './utility/util-watch';

import './styles/flex.less';
import './styles/site.less';
import './styles/challonger-font.css';
import '../node_modules/angular-dragula/dist/dragula.min.css';

// Security check
(() =>
{
	var url = new URL(document.location.href);
	if (url.protocol == 'http:')
	{
		url.protocol = 'https:';
		document.location.href = url.toString();
	}
})();

export interface IAppModule extends ng.IModule
{
	/** (Service locator anti-pattern) */
	$injector: ng.auto.IInjectorService;
}

export interface IChallongerRootScope extends ng.IRootScopeService
{
	isDev: boolean;
	TournamentType: typeof TournamentType;
	TournamentTypeArray: TournamentType[];
}

var app = <IAppModule>angular.module("app", ['ng', angularAnimate, 'contenteditable', 'ngContextMenu', angularDragula(angular)]);
app.run(["$rootScope", "$injector", ($rootScope: IChallongerRootScope, $injector: ng.auto.IInjectorService) =>
{
	app.$injector = $injector;
	$rootScope.isDev = document.location.hostname == "localhost";
	$rootScope.TournamentType = TournamentType;
	//@ts-ignore
	$rootScope.TournamentTypeArray = Array.from<TournamentType>(TournamentType);
}])
app.controller("main", ["$scope", "$http", "dragulaService",
	($scope, $http, dragulaService) =>
	{
		$scope.viewModel = new MainViewModel(app.$injector, $scope, $http, dragulaService);
		// @ts-ignore (Debug)
		window.vm = $scope.viewModel;
	}]);

app.filter('range', function ()
{
	return function (n: number)
	{
		var res = [];
		for (var i = 0; i < n; i++)
		{
			res.push(i);
		}
		return res;
	};
});
app.filter('unsafe', ["$sce", ($sce: ng.ISCEService) => (value: any, type: string) => $sce.trustAs(type, value)]);
app.filter('unsafeResource', ["$sce", ($sce: ng.ISCEService) => (value: any) => $sce.trustAsResourceUrl(value)]);

app.filter('project', () => <T>(value: T, projectFunction: (input: T) => any) => projectFunction(value));

//TODO: keyboard shortcuts for results list, similar to seed list
//TODO: results list player context menu


registerMvvmPresenter(app);
registerEventUtilities(app);
registerProxyClick(app);

registerExpander(app);
registerInfoButton(app);

registerAutoFocus(app);
registerFocus(app);
registerInlineFile(app);
registerModelTypeInt(app);
registerContextMenuData(app);
registerDragDrop(app);
registerSelectOnFocus(app);
registerSelectText(app);
registerWatch(app);