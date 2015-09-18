this["Templates"] = this["Templates"] || {};
this["Templates"]["body.tmpl"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<!-- map -->");_.b("\n" + i);_.b("<div id=\"pane\">");_.b("\n" + i);_.b("    <div id=\"container\">");_.b("\n" + i);_.b("        <div id=\"map\"></div>");_.b("\n" + i);_.b("        <div id=\"side-panel\">");_.b("\n" + i);_.b("            <div id=\"top\">");_.b("\n" + i);_.b("                <div id=\"buffer-container\">");_.b("\n" + i);_.b("                    <div class=\"form-inline\">");_.b("\n" + i);_.b("                        <div class=\"form-group\">");_.b("\n" + i);_.b("                            <label for=\"buffer\">");_.b(_.v(_.f("Buffer",c,p,0)));_.b("</label>");_.b("\n" + i);_.b("                            <input id=\"buffer\" type=\"text\" class=\"form-control\" placeholder=\"");_.b(_.v(_.f("Meters",c,p,0)));_.b("\">");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                        <button class=\"btn btn-primary\" id=\"remove-all-btn\">");_.b(_.v(_.f("Clear map",c,p,0)));_.b("</button>");_.b("\n" + i);_.b("                        <button class=\"btn btn-warning\" id=\"mapclient-btn\">MapClient</button>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                </div>");_.b("\n" + i);_.b("                <div id=\"progress-container\"><span id=\"progress\"></span><span id=\"spinner\">&nbsp;<span><img src='http://www.gifstache.com/images/ajax_loader.gif' class='spinner'/></span></span></div>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("            <div role=\"tabpanel\">");_.b("\n" + i);_.b("                <!-- Nav tabs -->");_.b("\n" + i);_.b("                <ul class=\"nav nav-tabs\" role=\"tablist\" id=\"main-tabs\">");_.b("\n" + i);_.b("                    <li role=\"presentation\" class=\"active\"><a href=\"#search-content\" aria-controls=\"search-content\"");_.b("\n" + i);_.b("                                                              role=\"tab\"");_.b("\n" + i);_.b("                                                              data-toggle=\"tab\">");_.b(_.v(_.f("Search",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#result-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Result",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#info-content\" aria-controls=\"info-content\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Info",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#layer-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Layers",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#baselayer-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Baselayers",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#legend-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Legend",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#help-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Help",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#log-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">");_.b(_.v(_.f("Log",c,p,0)));_.b("</a></li>");_.b("\n" + i);_.b("                </ul>");_.b("\n" + i);_.b("\n" + i);_.b("                <!-- Tab panes -->");_.b("\n" + i);_.b("                <div class=\"tab-content\">");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane active\" id=\"search-content\">");_.b("\n" + i);_.b("                        <div id=\"places\">");_.b("\n" + i);_.b("                            <input id=\"custom-search\" class=\"typeahead\" type=\"text\" placeholder=\"");_.b(_.v(_.f("Address",c,p,0)));_.b("\">");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"result-content\">");_.b("\n" + i);_.b("                        <div id=\"result\">");_.b("\n" + i);_.b("                            <div id=\"result-origin\"></div>");_.b("\n" + i);_.b("                            <button class=\"btn btn-primary btn-xs\" id=\"print-btn\"");_.b("\n" + i);_.b("                                    disabled=\"true\">");_.b(_.v(_.f("Print report",c,p,0)));_.b("<img src='http://www.gifstache.com/images/ajax_loader.gif' class='print-spinner'/></button>");_.b("\n" + i);_.b("                            <button class=\"btn btn-primary btn-xs\" id=\"geomatic-btn\"");_.b("\n" + i);_.b("                                    disabled=\"true\">Hent Geomatic<img src='http://www.gifstache.com/images/ajax_loader.gif' class='print-spinner'/></button>");_.b("\n" + i);_.b("\n" + i);_.b("                            <div role=\"tabpanel\">");_.b("\n" + i);_.b("                                <!-- Nav tabs -->");_.b("\n" + i);_.b("                                <ul class=\"nav nav-tabs\" role=\"tablist\">");_.b("\n" + i);_.b("                                    <li role=\"presentation\" class=\"active\"><a href=\"#hits-content\"");_.b("\n" + i);_.b("                                                                              aria-controls=\"hits-content\" role=\"tab\"");_.b("\n" + i);_.b("                                                                              data-toggle=\"tab\">");_.b(_.v(_.f("With conflicts",c,p,0)));_.b("<span></span></a>");_.b("\n" + i);_.b("                                    </li>");_.b("\n" + i);_.b("                                    <li role=\"presentation\"><a href=\"#hits-data-content\"");_.b("\n" + i);_.b("                                                                              aria-controls=\"hits-data-content\" role=\"tab\"");_.b("\n" + i);_.b("                                                                              data-toggle=\"tab\">");_.b(_.v(_.f("Data from conflicts",c,p,0)));_.b("<span></span></a>");_.b("\n" + i);_.b("                                    </li>");_.b("\n" + i);_.b("                                    <li role=\"presentation\"><a href=\"#nohits-content\" aria-controls=\"nohits-content\"");_.b("\n" + i);_.b("                                                               role=\"tab\"");_.b("\n" + i);_.b("                                                               data-toggle=\"tab\">");_.b(_.v(_.f("Without conflicts",c,p,0)));_.b("<span></span></a></li>");_.b("\n" + i);_.b("                                    <li role=\"presentation\"><a href=\"#error-content\" aria-controls=\"error-content\"");_.b("\n" + i);_.b("                                                               role=\"tab\"");_.b("\n" + i);_.b("                                                               data-toggle=\"tab\">");_.b(_.v(_.f("Errors",c,p,0)));_.b("<span></span></a></li>");_.b("\n" + i);_.b("                                </ul>");_.b("\n" + i);_.b("\n" + i);_.b("                                <!-- Tab panes -->");_.b("\n" + i);_.b("                                <div class=\"tab-content\">");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane active\" id=\"hits-content\">");_.b("\n" + i);_.b("                                        <div id=\"hits\">");_.b("\n" + i);_.b("                                            <table class=\"table table-hover\">");_.b("\n" + i);_.b("                                                <thead>");_.b("\n" + i);_.b("                                                <tr>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Layer",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Number of objects",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Show",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                </tr>");_.b("\n" + i);_.b("                                                </thead>");_.b("\n" + i);_.b("                                                <tbody></tbody>");_.b("\n" + i);_.b("                                            </table>");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"hits-data-content\">");_.b("\n" + i);_.b("                                        <div id=\"hits-data\">");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"nohits-content\">");_.b("\n" + i);_.b("                                        <div id=\"nohits\">");_.b("\n" + i);_.b("                                            <table class=\"table table-hover\">");_.b("\n" + i);_.b("                                                <thead>");_.b("\n" + i);_.b("                                                <tr>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Layer",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Number of objects",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Show",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                </tr>");_.b("\n" + i);_.b("                                                </thead>");_.b("\n" + i);_.b("                                                <tbody></tbody>");_.b("\n" + i);_.b("                                            </table>");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"error-content\">");_.b("\n" + i);_.b("                                        <div id=\"error\">");_.b("\n" + i);_.b("                                            <table class=\"table table-hover\">");_.b("\n" + i);_.b("                                                <thead>");_.b("\n" + i);_.b("                                                <tr>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Layer",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                    <th>");_.b(_.v(_.f("Severity",c,p,0)));_.b("</th>");_.b("\n" + i);_.b("                                                </tr>");_.b("\n" + i);_.b("                                                </thead>");_.b("\n" + i);_.b("                                                <tbody></tbody>");_.b("\n" + i);_.b("                                            </table>");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                </div>");_.b("\n" + i);_.b("                            </div>");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"info-content\">");_.b("\n" + i);_.b("                        <div class=\"alert alert-info\" role=\"alert\">");_.b(_.t(_.f("Info text",c,p,0)));_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("                        <div id=\"info-box\">");_.b("\n" + i);_.b("                            <div id=\"modal-info-body\">");_.b("\n" + i);_.b("                                <ul class=\"nav nav-tabs\" id=\"info-tab\"></ul>");_.b("\n" + i);_.b("                                <div class=\"tab-content\" id=\"info-pane\"></div>");_.b("\n" + i);_.b("                            </div>");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"layer-content\">");_.b("\n" + i);_.b("                        <div class=\"panel-group\" id=\"layers\" role=\"tablist\" aria-multiselectable=\"true\"></div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"baselayer-content\">");_.b("\n" + i);_.b("                        <div class=\"panel-group\" id=\"baselayers\" role=\"tablist\" aria-multiselectable=\"true\">");_.b("\n" + i);_.b("                            <ul class=\"list-group\" id=\"base-layer-list\"></ul>");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"legend-content\">");_.b("\n" + i);_.b("                        <div id=\"legend\"></div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"help-content\">...</div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"log-content\">");_.b("\n" + i);_.b("                        <textarea style=\"width: 100%\" rows=\"8\" id=\"console\"></textarea>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                </div>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <nav class=\"navbar navbar-default\" role=\"navigation\">");_.b("\n" + i);_.b("        <div class=\"container-fluid\">");_.b("\n" + i);_.b("            <div class=\"navbar-header\">");_.b("\n" + i);_.b("                <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\"");_.b("\n" + i);_.b("                        data-target=\"#bs-example-navbar-collapse-1\">");_.b("\n" + i);_.b("                    <span class=\"sr-only\">Toggle navigation</span>");_.b("\n" + i);_.b("                    <span class=\"icon-bar\"></span>");_.b("\n" + i);_.b("                    <span class=\"icon-bar\"></span>");_.b("\n" + i);_.b("                    <span class=\"icon-bar\"></span>");_.b("\n" + i);_.b("                </button>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("            <div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">");_.b("\n" + i);_.b("                <ul class=\"nav navbar-nav\">");_.b("\n" + i);_.b("                    <li>");_.b("\n" + i);_.b("                        <form class=\"navbar-form navbar-left\" role=\"search\" onsubmit=\"return false;\">");_.b("\n" + i);_.b("                            <div class=\"form-group\">");_.b("\n" + i);_.b("                                <input type=\"text\" id=\"search-input\" name=\"search-input\" class=\"form-control\"");_.b("\n" + i);_.b("                                       placeholder=\"");_.b(_.v(_.f("Search",c,p,0)));_.b("\">");_.b("\n" + i);_.b("                            </div>");_.b("\n" + i);_.b("                        </form>");_.b("\n" + i);_.b("                    </li>");_.b("\n" + i);_.b("                    <li>");_.b("\n" + i);_.b("                        <button id=\"locate-btn\" type=\"button\" class=\"btn btn-default navbar-btn\">");_.b("\n" + i);_.b("                            <i class=\"fa fa-location-arrow\"></i>");_.b("\n" + i);_.b("                        </button>");_.b("\n" + i);_.b("                    </li>");_.b("\n" + i);_.b("                </ul>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("    </nav>");_.b("\n" + i);_.b("</div>");return _.fl();;});