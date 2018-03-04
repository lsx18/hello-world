/**
 * Title: header component is a compound component of img, label and menu
 * Author: LiXizhi
 * Date: 2018.2.5 
 * Desc: 
 */
define([
    'app', 
    'text!wikimod/adi/section/header/header.template.html',
    'wikimod/adi/component/menu/menu',
    'wikimod/adi/component/logo/logo',
    'wikimod/adi/component/business_name/business_name',
    'wikimod/adi/component/tagline/tagline',
], function (app, template) {
  
    let styles = {
        "header-style-0" : {
            container : {
                padding: '10px'
            },
            card : {
                padding: '30px'
            }
        },
        "header-style-1" : {
            button : {
                padding: '20px'
            }
        }
    };

    app.registerComponent("adiHeader", {
        template : template,
        bindings : {
            params : "<"
        },
        controller : function($scope){          
            this.componentMode     = "section";
            this.generateClassName = app.generateSectionClassName.bind(this);
            
            $scope.$watch('$ctrl.params', function(newParams, oldParams){
                let designId = this.params.design.id;
                
                this.css = app.generateClassStyle(designId, styles[designId]);
            }.bind(this));
        }
    });

    return styles;
});
