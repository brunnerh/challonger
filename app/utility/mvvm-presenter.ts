export function registerMvvmPresenter(app: ng.IModule)
{
	app.directive('mvvmPresenter', () => ({
		scope: {
			viewModel: "=",
			viewPath: "=",
		},
		replace: true,
		template: '<ng-include src="viewPath"/>',
		link: (scope: IMvvmPresenterScope) =>
		{
			scope.outerScope = scope.$parent;
		}
	}));
}

interface IMvvmPresenterScope extends ng.IScope
{
	viewModel: any;
	viewPath: string;
	outerScope: ng.IScope;
}