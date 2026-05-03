import {useLocation, useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProjectById} from "../../lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
//import {createProject, getProject} from "../../lib/puter.action";
const VisualizerId = () => {

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const{userId}=useOutletContext<AuthContext>()
    const { initialImage, initialRender, name } = (location.state || {}) as VisualizerLocationState;
    const hasInitialGenerated = useRef(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [project, setProject] = useState<DesignItem | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>( null);
    const[isProjectLoading, setIsProjectLoading] = useState(true);

    const handleBack = () => navigate('/');

    const handleExport = async () => {
        if (!currentImage) return;

        const fileName = `roomify-${project?.id || id || 'render'}.png`;
        const link = document.createElement('a');
        let objectUrl: string | null = null;

        try {
            if (currentImage.startsWith('data:')) {
                link.href = currentImage;
            } else {
                const response = await fetch(currentImage);
                if (!response.ok) throw new Error('Failed to download rendered image');
                const blob = await response.blob();
                objectUrl = URL.createObjectURL(blob);
                link.href = objectUrl;
            }

            link.download = fileName;
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Export failed', error);
        } finally {
            document.body.removeChild(link);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        }
    };

    const runGeneration= async (item: DesignItem)=>{
        if(!id||!item.sourceImage) return;
        try {
            setIsProcessing(true);
            const result = await generate3DView({sourceImage: item.sourceImage});

            if (result.renderedImage) {
                setCurrentImage(result.renderedImage);
                const updatedItem = {
                    ... item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({item: updatedItem, visibility:"private"})
                if (saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        }catch(error){
            console.error('generation failed', error)
        } finally{
            setIsProcessing(false);
        }
    }


    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            if (initialImage) {
                setProject({
                    id,
                    name,
                    sourceImage: initialImage,
                    renderedImage: initialRender || null,
                    timestamp: Date.now(),
                    ownerId: userId ?? null,
                });
                setCurrentImage(initialRender || null);
                setIsProjectLoading(false);
                hasInitialGenerated.current = false;
                return;
            }

            setIsProjectLoading(true);

            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            setProject(fetchedProject);
            setCurrentImage(fetchedProject?.renderedImage || null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id, initialImage, initialRender, name, userId]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return(


             <div className="visualizer">
                 <nav className="topbar">
                     <div className="brand">
                         <Box className="logo" />

                         <span className="name">Roomify</span>
                     </div>
                     <Button variant="ghost" size="sm" onClick={handleBack}
                             className="exit">
                         <X className="icon" /> Exit Editor
                     </Button>
                 </nav>

                 <section className="content">
                     <div className="panel">
                     <div className="panel-header">
                         <div className="panel-meta">
                             <p>Project</p>
                             <h2>{project?.name || name || `Residence ${id}`}</h2>
                             <p className="note"> Created by You</p>
                         </div>
                         <div className="panel-actions">
                             <Button
                                 size="sm"
                                 onClick={handleExport}
                                 className="export"
                                 disabled={!currentImage}
                             >
                                 <Download className="w-4 h-4 mr-2" /> Export
                             </Button>
                             <Button size="sm" onClick={() => {}} className="share">
                                 <Share2 className="w-4 h-4 mr-2" />
                                 Share
                             </Button>
                         </div>
                     </div>

                         <div className={`render-area ${isProcessing ? 'processing' : ''}`}>
                             {currentImage ? (
                                 <img src={currentImage} alt="AI Render"
                                     className="render-img"/>
                             ):(
                                 <div className="render-placeholder">
                                     {(project?.sourceImage) && (
                                         <img src={project?.sourceImage} alt="Original"
                                              className="render-fallback"/>
                                     )}
                                 </div>
                             )}
                             {isProcessing && (
                                 <div className="render-overlay">
                                     <div className="rendering-card">
                                         <RefreshCcw className="spinner"/>
                                         <span className="title"> Rendering...</span>
                                         <span className="subtitle">Generating your 3D visualization</span>
                                     </div>
                                 </div>
                             )}
                         </div>

                     </div>
                     {/*react slider starts*/}
                     <div className="panel compare">
                         <div className="panel-header">
                             <div className="panel-meta">
                                 <p>Comparison</p>
                                 <h3>Before and After</h3>
                             </div>
                             <div className="hint"> Drag to compare</div>
                         </div>
                         <div className="compare-stage">
                             {project?.sourceImage && currentImage ? (
                                 <ReactCompareSlider
                                     defaultValue={50}
                                     style={{width:'100%',height:'auto'}}
                                     itemOne={
                                     <ReactCompareSliderImage src={project?.sourceImage}alt="before" className="compare-img"/>
                                     }
                                     itemTwo={
                                         <ReactCompareSliderImage src={currentImage}alt="after" className="compare-img"/>
                                     }
                                 />
                             ):(
                                 <div className="compare-fallback">
                                     {project?.sourceImage && (
                                         <img src={project.sourceImage} alt="Before" className="compare-img"/>
                                     )}
                                 </div>
                             )}
                         </div>
                     </div>
                 {/*    reacter slider ends*/}
                 </section>

            </div>

    )}

export default VisualizerId;
