this["Templates"] = this["Templates"] || {};
this["Templates"]["body.tmpl"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<!-- map -->");_.b("\n" + i);_.b("<div id=\"pane\">");_.b("\n" + i);_.b("    <div id=\"container\">");_.b("\n" + i);_.b("        <div id=\"map\"></div>");_.b("\n" + i);_.b("        <div id=\"side-panel\">");_.b("\n" + i);_.b("            <div id=\"top\">");_.b("\n" + i);_.b("                <div id=\"buffer-container\">");_.b("\n" + i);_.b("                    <form class=\"form-inline\">");_.b("\n" + i);_.b("                        <div class=\"form-group\">");_.b("\n" + i);_.b("                            <label for=\"buffer\">Buffer</label>");_.b("\n" + i);_.b("                            <input id=\"buffer\" type=\"text\" class=\"form-control\" placeholder=\"Meter\">");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </form>");_.b("\n" + i);_.b("                </div>");_.b("\n" + i);_.b("                <div id=\"progress\"></div>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("            <div role=\"tabpanel\">");_.b("\n" + i);_.b("                <!-- Nav tabs -->");_.b("\n" + i);_.b("                <ul class=\"nav nav-tabs\" role=\"tablist\" id=\"main-tabs\">");_.b("\n" + i);_.b("                    <li role=\"presentation\" class=\"active\"><a href=\"#search-content\" aria-controls=\"search-content\"");_.b("\n" + i);_.b("                                                              role=\"tab\"");_.b("\n" + i);_.b("                                                              data-toggle=\"tab\">Søg</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#result-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">Resultat</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#info-content\" aria-controls=\"info-content\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">Info</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#layer-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">Lag</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#legend-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">Signatur</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#help-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">Hjælp</a></li>");_.b("\n" + i);_.b("                    <li role=\"presentation\"><a href=\"#log-content\" aria-controls=\"\" role=\"tab\"");_.b("\n" + i);_.b("                                               data-toggle=\"tab\">Log</a></li>");_.b("\n" + i);_.b("                </ul>");_.b("\n" + i);_.b("\n" + i);_.b("                <!-- Tab panes -->");_.b("\n" + i);_.b("                <div class=\"tab-content\">");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane active\" id=\"search-content\">");_.b("\n" + i);_.b("                        <div id=\"places\">");_.b("\n" + i);_.b("                            <input class=\"typeahead\" type=\"text\" placeholder=\"Adresse eller matrikelnr.\">");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"result-content\">");_.b("\n" + i);_.b("                        <div id=\"result\">");_.b("\n" + i);_.b("                            <a target=\"_blank\" href=\"#\" class=\"btn btn-primary btn-xs\"");_.b("\n" + i);_.b("                               disabled=\"true\">Print resultat</a>");_.b("\n" + i);_.b("\n" + i);_.b("                            <div role=\"tabpanel\">");_.b("\n" + i);_.b("                                <!-- Nav tabs -->");_.b("\n" + i);_.b("                                <ul class=\"nav nav-tabs\" role=\"tablist\">");_.b("\n" + i);_.b("                                    <li role=\"presentation\" class=\"active\"><a href=\"#hits-content\"");_.b("\n" + i);_.b("                                                                              aria-controls=\"hits-content\" role=\"tab\"");_.b("\n" + i);_.b("                                                                              data-toggle=\"tab\">Hits</a></li>");_.b("\n" + i);_.b("                                    <li role=\"presentation\"><a href=\"#nohits-content\" aria-controls=\"nohits-content\"");_.b("\n" + i);_.b("                                                               role=\"tab\"");_.b("\n" + i);_.b("                                                               data-toggle=\"tab\">Ingen hits</a></li>");_.b("\n" + i);_.b("                                    <li role=\"presentation\"><a href=\"#error-content\" aria-controls=\"error-content\"");_.b("\n" + i);_.b("                                                               role=\"tab\"");_.b("\n" + i);_.b("                                                               data-toggle=\"tab\">Fejl</a></li>");_.b("\n" + i);_.b("                                </ul>");_.b("\n" + i);_.b("\n" + i);_.b("                                <!-- Tab panes -->");_.b("\n" + i);_.b("                                <div class=\"tab-content\">");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane active\" id=\"hits-content\">");_.b("\n" + i);_.b("                                        <div id=\"hits\">");_.b("\n" + i);_.b("                                            <table class=\"table table-hover\">");_.b("\n" + i);_.b("                                                <thead>");_.b("\n" + i);_.b("                                                <tr>");_.b("\n" + i);_.b("                                                    <th>Lag</th>");_.b("\n" + i);_.b("                                                    <th>Antal hits</th>");_.b("\n" + i);_.b("                                                </tr>");_.b("\n" + i);_.b("                                                </thead>");_.b("\n" + i);_.b("                                                <tbody></tbody>");_.b("\n" + i);_.b("                                            </table>");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"nohits-content\">");_.b("\n" + i);_.b("                                        <div id=\"nohits\">");_.b("\n" + i);_.b("                                            <table class=\"table table-hover\">");_.b("\n" + i);_.b("                                                <thead>");_.b("\n" + i);_.b("                                                <tr>");_.b("\n" + i);_.b("                                                    <th>Lag</th>");_.b("\n" + i);_.b("                                                    <th>Antal hits</th>");_.b("\n" + i);_.b("                                                </tr>");_.b("\n" + i);_.b("                                                </thead>");_.b("\n" + i);_.b("                                                <tbody></tbody>");_.b("\n" + i);_.b("                                            </table>");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"error-content\">");_.b("\n" + i);_.b("                                        <div id=\"error\">");_.b("\n" + i);_.b("                                            <table class=\"table table-hover\">");_.b("\n" + i);_.b("                                                <thead>");_.b("\n" + i);_.b("                                                <tr>");_.b("\n" + i);_.b("                                                    <th>Lag</th>");_.b("\n" + i);_.b("                                                    <th>Alvorlighed</th>");_.b("\n" + i);_.b("                                                </tr>");_.b("\n" + i);_.b("                                                </thead>");_.b("\n" + i);_.b("                                                <tbody></tbody>");_.b("\n" + i);_.b("                                            </table>");_.b("\n" + i);_.b("                                        </div>");_.b("\n" + i);_.b("                                    </div>");_.b("\n" + i);_.b("                                </div>");_.b("\n" + i);_.b("                            </div>");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"info-content\">");_.b("\n" + i);_.b("                        <div id=\"info-box\">");_.b("\n" + i);_.b("                            <div id=\"modal-info-body\">");_.b("\n" + i);_.b("                                <ul class=\"nav nav-tabs\" id=\"info-tab\"></ul>");_.b("\n" + i);_.b("                                <div class=\"tab-content\" id=\"info-pane\"></div>");_.b("\n" + i);_.b("                            </div>");_.b("\n" + i);_.b("                        </div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"layer-content\">");_.b("\n" + i);_.b("                        <div class=\"panel-group\" id=\"layers\" role=\"tablist\" aria-multiselectable=\"true\"></div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"legend-content\">");_.b("\n" + i);_.b("                        <div id=\"legend\"></div>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"help-content\">...</div>");_.b("\n" + i);_.b("                    <div role=\"tabpanel\" class=\"tab-pane\" id=\"log-content\">");_.b("\n" + i);_.b("                        <textarea style=\"width: 100%\" rows=\"8\" id=\"console\"></textarea>");_.b("\n" + i);_.b("                    </div>");_.b("\n" + i);_.b("                </div>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("    </div>");_.b("\n" + i);_.b("    <nav class=\"navbar navbar-default\" role=\"navigation\">");_.b("\n" + i);_.b("        <div class=\"container-fluid\">");_.b("\n" + i);_.b("            <div class=\"navbar-header\">");_.b("\n" + i);_.b("                <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\"");_.b("\n" + i);_.b("                        data-target=\"#bs-example-navbar-collapse-1\">");_.b("\n" + i);_.b("                    <span class=\"sr-only\">Toggle navigation</span>");_.b("\n" + i);_.b("                    <span class=\"icon-bar\"></span>");_.b("\n" + i);_.b("                    <span class=\"icon-bar\"></span>");_.b("\n" + i);_.b("                    <span class=\"icon-bar\"></span>");_.b("\n" + i);_.b("                </button>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("            <div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">");_.b("\n" + i);_.b("                <ul class=\"nav navbar-nav\" style=\"float: left\">");_.b("\n" + i);_.b("                    <li class=\"dropdown\">");_.b("\n" + i);_.b("                        <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">");_.b(_.t(_.f("Baselayers",c,p,0)));_.b(" <b");_.b("\n" + i);_.b("                                class=\"caret\"></b></a>");_.b("\n" + i);_.b("                        <ul class=\"dropdown-menu\" id=\"base-layer-list\">");_.b("\n" + i);_.b("                        </ul>");_.b("\n" + i);_.b("                    </li>");_.b("\n" + i);_.b("                </ul>");_.b("\n" + i);_.b("                <ul class=\"nav navbar-nav\">");_.b("\n" + i);_.b("                    <li>");_.b("\n" + i);_.b("                        <form class=\"navbar-form navbar-left\" role=\"search\" onsubmit=\"return false;\">");_.b("\n" + i);_.b("                            <div class=\"form-group\">");_.b("\n" + i);_.b("                                <input type=\"text\" id=\"search-input\" name=\"search-input\" class=\"form-control\"");_.b("\n" + i);_.b("                                       placeholder=\"");_.b(_.t(_.f("Search",c,p,0)));_.b("\">");_.b("\n" + i);_.b("                            </div>");_.b("\n" + i);_.b("                        </form>");_.b("\n" + i);_.b("                    </li>");_.b("\n" + i);_.b("                    <li>");_.b("\n" + i);_.b("                        <button id=\"locate-btn\" type=\"button\" class=\"btn btn-default navbar-btn\">");_.b("\n" + i);_.b("                            <i class=\"fa fa-location-arrow\"></i>");_.b("\n" + i);_.b("                        </button>");_.b("\n" + i);_.b("                    </li>");_.b("\n" + i);_.b("\n" + i);_.b("                </ul>");_.b("\n" + i);_.b("            </div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("    </nav>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div id=\"menu\"></div>");return _.fl();;});